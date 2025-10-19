import React from 'react';

type Mode = 'responsive' | 'block' | 'redirect';

export const MobileGuard: React.FC<{
  mode?: Mode;
  redirectTo?: string;
  children: React.ReactNode;
}> = ({ mode = 'block', redirectTo = '/#/', children }) => {
  const [w, setW] = React.useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );

  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = w >= 1024;

  if (mode === 'responsive') return <>{children}</>;

  if (mode === 'redirect' && isDesktop) {
    if (typeof window !== 'undefined') window.location.href = redirectTo;
    return null;
  }

  if (mode === 'block' && isDesktop) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <h2 style={{ marginBottom: '12px' }}>Mobile App Only</h2>
          <p>This app is designed for mobile and tablet devices. Please use a mobile or tablet device.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
