import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MembersListHeader from '../MembersListHeader';
import { renderWithProviders } from '@/test/setupTests';

describe('MembersListHeader Component', () => {
  const defaultProps = {
    userRole: 'admin',
    hasMembers: true,
    collectorInfo: {},
    selectedMember: undefined,
    onProfileUpdated: vi.fn(),
    onPrint: vi.fn(),
    members: [
      { id: '1', member_number: 'TEST001', full_name: 'Test User' },
      { id: '2', member_number: 'TEST002', full_name: 'Another User' },
    ],
  };

  it('renders header with title', () => {
    renderWithProviders(<MembersListHeader {...defaultProps} />);
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('shows export button for admin users', () => {
    renderWithProviders(<MembersListHeader {...defaultProps} />);
    expect(screen.getByText('Export Members')).toBeInTheDocument();
  });

  it('hides export button for non-admin users', () => {
    renderWithProviders(
      <MembersListHeader {...defaultProps} userRole="member" />
    );
    expect(screen.queryByText('Export Members')).not.toBeInTheDocument();
  });

  it('displays correct member count', () => {
    renderWithProviders(<MembersListHeader {...defaultProps} />);
    expect(screen.getByText('Showing 2 members')).toBeInTheDocument();
  });

  it('handles singular member count', () => {
    renderWithProviders(
      <MembersListHeader 
        {...defaultProps} 
        members={[{ id: '1', member_number: 'TEST001', full_name: 'Test User' }]}
      />
    );
    expect(screen.getByText('Showing 1 member')).toBeInTheDocument();
  });

  it('handles empty members list', () => {
    renderWithProviders(
      <MembersListHeader 
        {...defaultProps} 
        members={[]}
        hasMembers={false}
      />
    );
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});