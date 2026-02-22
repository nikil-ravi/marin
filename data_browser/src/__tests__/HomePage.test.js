import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomePage from '../HomePage';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

test('opens a custom path from dialog', async () => {
  axios.get.mockResolvedValue({
    data: { root_paths: ['gs://marin-us-central2/root'] },
  });

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/view" element={<div>View route loaded</div>} />
      </Routes>
    </MemoryRouter>,
  );

  await screen.findByText('Start browsing');
  await userEvent.click(screen.getByRole('button', { name: 'Open path' }));
  await userEvent.type(screen.getByLabelText('Path'), 'gs://marin-us-central2/custom/path');
  await userEvent.click(screen.getByRole('button', { name: 'Open' }));

  expect(await screen.findByText('View route loaded')).toBeInTheDocument();
});
