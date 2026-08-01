import { describe, expect, it, vi } from 'vitest';

import { initBetterAuthSSOProviders } from './index';

vi.mock('@/envs/app', () => ({
  appEnv: { APP_URL: 'https://example.com' },
}));

vi.mock('@/envs/auth', () => ({
  authEnv: {
    AUTH_DISABLE_SIGNUP: true,
    AUTH_GITHUB_ID: 'github-client-id',
    AUTH_GITHUB_SECRET: 'github-client-secret',
    AUTH_SSO_PROVIDERS: 'github',
  },
}));

vi.mock('@/libs/better-auth/utils/server', () => ({
  parseSSOProviders: () => ['github'],
}));

describe('initBetterAuthSSOProviders', () => {
  it('should allow existing GitHub users to sign in without allowing first-time signup', () => {
    const { socialProviders } = initBetterAuthSSOProviders();

    expect(socialProviders.github).toMatchObject({
      clientId: 'github-client-id',
      disableSignUp: true,
    });
  });
});
