'use client';

import { Navigate } from 'react-router';

import { useAuthServerConfigStore } from '@/features/AuthShell';

import BetterAuthSignUpForm from './BetterAuthSignUpForm';

const SignUp = () => {
  const disableEmailPassword = useAuthServerConfigStore(
    (s) => s.serverConfig.disableEmailPassword || false,
  );
  const disableSignUp = useAuthServerConfigStore((s) => s.serverConfig.disableSignUp || false);

  if (disableEmailPassword || disableSignUp) return <Navigate replace to="/signin" />;

  return <BetterAuthSignUpForm />;
};

export default SignUp;
