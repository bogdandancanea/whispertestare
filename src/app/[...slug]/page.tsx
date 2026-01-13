'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component catches all routes that don't exist
// and redirects them to the /invalid page.
export default function NotFoundCatchAll() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/invalid');
  }, [router]);

  return null;
}
