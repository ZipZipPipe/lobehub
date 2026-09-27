// @vitest-environment node
import { getTestDB } from '@lobechat/database/test-utils';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { users, workspaceMembers, workspaces } from '@/database/schemas';

import { githubInstall } from '../githubInstall';

const serverDB = await getTestDB();
const userId = 'scm-install-user';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  issueState: vi.fn(),
}));

vi.mock('@/database/core/db-adaptor', () => ({ getServerDB: vi.fn(async () => serverDB) }));
vi.mock('@/envs/app', () => ({ appEnv: { APP_URL: 'https://lobe.example' } }));
const scmEnv = vi.hoisted(() => ({
  ENABLED_GITHUB_APP: true,
  ENABLED_GITHUB_APP_OAUTH: true,
  GITHUB_APP_SLUG: 'dev',
}));
vi.mock('@/envs/scm', () => ({ scmEnv }));
vi.mock('@/auth', () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock('@/server/services/scm/oauth/stateStore', () => ({
  issueScmInstallState: mocks.issueState,
}));
vi.mock('@/server/services/scm/github/app', () => ({
  buildGitHubAuthorizeUrl: (state: string) =>
    `https://github.com/login/oauth/authorize?client_id=client&state=${state}`,
  buildGitHubInstallUrl: (state: string) =>
    `https://github.com/apps/dev/installations/new?state=${state}`,
}));

const app = new Hono().get('/install', githubInstall);
const install = (query: Record<string, string>) =>
  app.request(`http://localhost/install?${new URLSearchParams(query)}`);

beforeEach(async () => {
  await serverDB.insert(users).values({ id: userId });
  mocks.getSession.mockResolvedValue({ user: { id: userId } });
  mocks.issueState.mockResolvedValue('state-1');
  scmEnv.ENABLED_GITHUB_APP_OAUTH = true;
});

afterEach(async () => {
  await serverDB.delete(workspaces);
  await serverDB.delete(users);
  vi.clearAllMocks();
});

describe('githubInstall', () => {
  it('issues a state for the session user and sends them to GitHub', async () => {
    const res = await install({ returnTo: '/settings/integrations/github' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(
      'https://github.com/login/oauth/authorize?client_id=client&state=state-1',
    );
    expect(mocks.issueState).toHaveBeenCalledWith({
      lobeUserId: userId,
      returnTo: '/settings/integrations/github',
      workspaceId: null,
    });
  });

  it('uses the installation page when OAuth is not configured', async () => {
    scmEnv.ENABLED_GITHUB_APP_OAUTH = false;
    const res = await install({});
    expect(res.headers.get('location')).toBe(
      'https://github.com/apps/dev/installations/new?state=state-1',
    );
  });

  it('uses the public app URL when the user needs to sign in', async () => {
    mocks.getSession.mockResolvedValue(null);
    const res = await install({});
    expect(res.headers.get('location')).toBe(
      'https://lobe.example/signin?callbackUrl=%2Fapi%2Fwebhooks%2Fgithub%2Finstall',
    );
  });

  it('drops a cross-origin returnTo before it reaches the state', async () => {
    await install({ returnTo: 'https://evil.example/phish' });
    expect(mocks.issueState).toHaveBeenCalledWith(expect.objectContaining({ returnTo: undefined }));
  });

  it('lets members install into a workspace but not viewers', async () => {
    const [workspace] = await serverDB
      .insert(workspaces)
      .values({ name: 'ws', primaryOwnerId: userId, slug: 'scm-install-ws' })
      .returning();

    await serverDB
      .insert(workspaceMembers)
      .values({ role: 'viewer', userId, workspaceId: workspace.id });
    const denied = await install({ workspaceId: workspace.id });
    expect(denied.status).toBe(403);
    expect(mocks.issueState).not.toHaveBeenCalled();

    await serverDB
      .update(workspaceMembers)
      .set({ role: 'member' })
      .where(eq(workspaceMembers.workspaceId, workspace.id));
    const allowed = await install({ workspaceId: workspace.id });
    expect(allowed.status).toBe(302);
    expect(mocks.issueState).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: workspace.id }),
    );
  });
});
