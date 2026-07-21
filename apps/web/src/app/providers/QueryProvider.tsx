import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a single QueryClient instance with robust retry and stale rules
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Avoid looping retries on authorization failures
      refetchOnWindowFocus: false, // Let's keep network calls explicit for weak connections
      staleTime: 1000 * 60 * 5, // Cache queries for 5 minutes by default
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
export default QueryProvider;
