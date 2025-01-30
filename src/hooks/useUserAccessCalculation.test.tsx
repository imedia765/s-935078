import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserAccessCalculation } from './useUserAccessCalculation';
import { supabase } from '@/integrations/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUserAccessCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default access when no userId is provided', async () => {
    const { result } = renderHook(() => useUserAccessCalculation(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(expect.objectContaining({
        baseRole: 'member',
        permissions: expect.objectContaining({
          users: expect.objectContaining({
            manageBasicUsers: false,
            manageAdminUsers: false,
            viewUsers: false,
          })
        })
      }));
    });
  });

  it('should grant admin permissions when user has admin role', async () => {
    // Mock Supabase response for admin role
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(
          Promise.resolve({
            data: [{ role: 'admin', created_at: new Date().toISOString() }],
            error: null
          })
        )
      })
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useUserAccessCalculation('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(expect.objectContaining({
        baseRole: 'admin',
        permissions: expect.objectContaining({
          users: expect.objectContaining({
            manageBasicUsers: true,
            manageAdminUsers: true,
            viewUsers: true,
          }),
          system: expect.objectContaining({
            accessSystem: true,
            manageSystemSettings: true,
          })
        })
      }));
    });
  });

  it('should grant collector permissions when user has collector role', async () => {
    // Mock Supabase response for collector role
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(
          Promise.resolve({
            data: [{ role: 'collector', created_at: new Date().toISOString() }],
            error: null
          })
        )
      })
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useUserAccessCalculation('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(expect.objectContaining({
        baseRole: 'collector',
        permissions: expect.objectContaining({
          users: expect.objectContaining({
            manageBasicUsers: false,
            manageAdminUsers: false,
            viewUsers: true,
          }),
          collectors: expect.objectContaining({
            manageCollectors: false,
            viewCollectorPerformance: true,
          })
        })
      }));
    });
  });

  it('should apply enhanced role permissions correctly', async () => {
    // Mock basic role response
    const mockBasicRoles = vi.fn().mockResolvedValue({
      data: [{ role: 'member', created_at: new Date().toISOString() }],
      error: null
    });

    // Mock enhanced role response
    const mockEnhancedRoles = vi.fn().mockResolvedValue({
      data: [{ role_name: 'financial_admin', is_active: true }],
      error: null
    });

    // Setup mock implementation for both queries
    (supabase.from as any).mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(
          table === 'user_roles' ? mockBasicRoles() : {
            eq: vi.fn().mockReturnValue(mockEnhancedRoles())
          }
        )
      })
    }));

    const { result } = renderHook(() => useUserAccessCalculation('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(expect.objectContaining({
        baseRole: 'member',
        permissions: expect.objectContaining({
          payments: expect.objectContaining({
            collectPayments: true,
            viewPaymentReports: true,
            managePaymentMethods: true,
          })
        })
      }));
    });
  });

  it('should handle Supabase errors gracefully', async () => {
    // Mock Supabase error response
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: new Error('Database error')
          })
        )
      })
    });

    (supabase.from as any).mockImplementation(mockFrom);

    const { result } = renderHook(() => useUserAccessCalculation('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(expect.objectContaining({
        baseRole: 'member',
        permissions: expect.objectContaining({
          users: expect.objectContaining({
            manageBasicUsers: false,
            manageAdminUsers: false,
            viewUsers: false,
          })
        })
      }));
    });
  });
});