import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Create a custom render method that includes providers
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface RenderWithProvidersOptions {
  route?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) {
  const {
    route = '/',
    queryClient = createTestQueryClient(),
  } = options;

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Add custom matchers
expect.extend({
  toHaveBeenCalledWithMatch(received: jest.Mock, expected: unknown) {
    const pass = this.equals(received.mock.calls[0], [expected]);
    return {
      pass,
      message: () => `expected ${received} to have been called with ${expected}`,
    };
  },
});