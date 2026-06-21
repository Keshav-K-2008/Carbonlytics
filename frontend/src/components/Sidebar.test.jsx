// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock the Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { fullName: 'Eco Champ', email: 'champ@test.com' },
    logout: vi.fn(),
    isAdmin: false
  })
}));

describe('Sidebar Component', () => {
  it('renders logo and application name', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoText = screen.getAllByText(/Carbon/i);
    expect(logoText.length).toBeGreaterThan(0);
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log Activity').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Climate News').length).toBeGreaterThan(0);
  });

  it('renders user details in footer', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Eco Champ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('champ@test.com').length).toBeGreaterThan(0);
  });
});
