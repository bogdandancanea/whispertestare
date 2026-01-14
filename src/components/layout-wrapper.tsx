
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import AndroidInputScrollFix from './android-input-fix';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isShowingContent, setIsShowingContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowingContent(true);
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        'transition-opacity duration-1000 ease-in',
        isShowingContent ? 'opacity-100' : 'opacity-0'
      )}
    >
      <AndroidInputScrollFix />
      {children}
    </div>
  );
}
