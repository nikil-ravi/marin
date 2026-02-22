import React from 'react';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ViewPage from '../ViewPage';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

test('renders text payloads and modern controls', async () => {
  axios.get.mockResolvedValue({
    data: {
      type: 'text',
      items: ['line one\n', 'line two\n'],
    },
  });

  const query = new URLSearchParams({
    paths: JSON.stringify(['gs://bucket/log.txt']),
    offset: '0',
    count: '5',
  }).toString();

  render(
    <MemoryRouter initialEntries={[`/view?${query}`]}>
      <Routes>
        <Route path="/view" element={<ViewPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText('Filters, sorting, and highlights')).toBeInTheDocument();
  expect(await screen.findByText(/line one/)).toBeInTheDocument();
});
