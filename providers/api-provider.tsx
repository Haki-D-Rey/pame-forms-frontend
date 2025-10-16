import { api, attachAuthInterceptors } from '@/lib/api';
import { useAuth } from '@/providers/auth';
import React, { useEffect } from 'react';

export default function ApiProvider({ children }: { children: React.ReactNode }) {
  const { getAccessToken, getRefreshToken, refreshAccessToken, signOut } = useAuth();

  useEffect(() => {
    const detach = attachAuthInterceptors(api, {
      getAccessToken,
      refreshAccessToken,
      onUnauthorized: signOut,
    });
    return () => detach();
  }, [getAccessToken, getRefreshToken, refreshAccessToken, signOut]);

  return <>{children}</>;
}
