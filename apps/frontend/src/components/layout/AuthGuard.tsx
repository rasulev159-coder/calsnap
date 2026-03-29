'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, accessToken, fetchMe } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/auth/login');
      return;
    }

    if (!user) {
      fetchMe().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [accessToken, user, fetchMe, router]);

  useEffect(() => {
    if (!checking && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [checking, user, router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
