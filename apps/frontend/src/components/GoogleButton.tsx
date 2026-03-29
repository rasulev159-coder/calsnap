'use client';

import { useEffect, useCallback } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1064929145470-1nopq0062hvv5l9d7i5iula6a4s9fu30.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
    handleGoogleCallback?: (response: any) => void;
  }
}

export default function GoogleButton({
  onSuccess,
  text = 'signin_with',
}: {
  onSuccess: (credential: string) => void;
  text?: 'signin_with' | 'signup_with';
}) {
  const handleCallback = useCallback(
    (response: any) => {
      if (response.credential) {
        onSuccess(response.credential);
      }
    },
    [onSuccess],
  );

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCallback,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        {
          theme: 'outline',
          size: 'large',
          width: 350,
          text,
          shape: 'rectangular',
          logo_alignment: 'center',
        },
      );
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [handleCallback, text]);

  return <div id="google-signin-btn" className="flex justify-center" />;
}
