import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../AppRoutes';
import { exercises } from '../../content';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const resultLinks = () =>
  within(screen.getByRole('main'))
    .getAllByRole('link')
    .map((a) => a.querySelector('div')?.textContent);

describe('Library', () => {
  it('lists every exercise', () => {
    renderAt('/library');
    expect(screen.getByText(`${exercises.length} exercises`)).toBeInTheDocument();
  });

  it('searches by name', async () => {
    renderAt('/library');
    await userEvent.type(screen.getByRole('searchbox'), 'sleeper');
    expect(resultLinks()).toEqual(['Sleeper stretch']);
  });

  it('filters by area and level from the URL', () => {
    renderAt('/library?area=shoulder&level=3');
    expect(resultLinks()).toEqual(['Kettlebell arm bar']);
  });

  it('filters by equipment I have', async () => {
    renderAt('/library?area=shoulder');
    await userEvent.click(screen.getByRole('checkbox', { name: /only show what i can do/i }));
    expect(resultLinks()).toEqual(['Shoulder CARs', 'Cross-body shoulder stretch']);
    await userEvent.click(screen.getByRole('button', { name: 'Pull-up bar' }));
    expect(resultLinks()).toEqual([
      'Shoulder CARs',
      'Cross-body shoulder stretch',
      'Dead hang',
      'Scapular pull-ups',
    ]);
  });

  it('shows an empty state', async () => {
    renderAt('/library');
    await userEvent.type(screen.getByRole('searchbox'), 'trampoline');
    expect(screen.getByText(/no exercises match/i)).toBeInTheDocument();
  });

  it('opens an exercise and links to its alternatives', async () => {
    renderAt('/library');
    await userEvent.click(
      screen.getByRole('link', { name: /cable external rotation \(arm at side\)/i }),
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cable external rotation (arm at side)' }),
    );
    expect(screen.getByText('3 × 12 reps per side')).toBeInTheDocument();
    expect(screen.getByText(/lightest plate/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /side-lying dumbbell/i }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Side-lying dumbbell external rotation' }),
    ).toBeInTheDocument();
  });

  it('handles an unknown exercise id', () => {
    renderAt('/library/nope');
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
  });
});
