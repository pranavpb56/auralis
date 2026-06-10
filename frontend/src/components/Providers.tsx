'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60000, retry: 1 } } }));
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#121220', color: '#f0f0f8', border: '1px solid #1c1c33', borderRadius: '12px', fontSize: '14px' },
        success: { iconTheme: { primary: '#7c3aed', secondary: '#f0f0f8' } },
      }} />
    </QueryClientProvider>
  );
}
