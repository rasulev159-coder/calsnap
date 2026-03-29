'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useHydration } from '@/hooks/useHydration';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useHydration();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      router.replace('/auth/login');
      return;
    }

    if (!user) {
      fetchMe();
    }
  }, [hydrated, accessToken, user, fetchMe, router]);

  useEffect(() => {
    if (hydrated && user && !user.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [hydrated, user, router]);

  // Show spinner until hydrated and user is loaded
  if (!hydrated || !accessToken || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
