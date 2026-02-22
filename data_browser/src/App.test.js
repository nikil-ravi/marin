import { render, screen } from '@testing-library/react';
import App from './App';
import axios from 'axios';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

test('renders app shell and home launch actions', async () => {
  axios.get.mockResolvedValue({
    data: { root_paths: ['gs://marin-us-central2'] },
  });

  render(<App />);
  expect(screen.getByText('Marin Data Browser')).toBeInTheDocument();
  expect(await screen.findByText('Start browsing')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Open path' })).toBeInTheDocument();
});
