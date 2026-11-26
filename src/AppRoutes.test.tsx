import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('app shell', () => {
  it('shows the five bottom tabs', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const labels = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['Today', 'Programs', 'Library', 'Progress', 'Settings']);
  });

  it('navigates between tabs', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Gymly' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Library' }));
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('aria-current', 'page');
  });

  it('redirects unknown routes to Today', () => {
    renderAt('/nope');
    expect(screen.getByRole('heading', { name: 'Gymly' })).toBeInTheDocument();
  });
});
