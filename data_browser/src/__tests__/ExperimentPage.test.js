import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExperimentPage from '../ExperimentPage';

jest.mock('axios', () => ({
  get: jest.fn(),
}));

const experimentPath = 'gs://bucket/experiment.json';

const experimentPayload = {
  prefix: 'demo',
  caller_path: '/tmp/ray/session/runtime_resources/working_dir_files/_ray_pkg_hash/experiments/demo.py',
  created_date: '2026-01-01T00:00:00Z',
  description: 'Demo experiment',
  steps: [
    {
      name: 'prep_step',
      fn_name: 'marin.download.filesystem.transfer.transfer_files',
      description: 'Prepare dataset',
      output_path: 'gs://bucket/output/prep',
      config: { input_path: 'gs://bucket/input/raw.jsonl' },
    },
    {
      name: 'train_step',
      fn_name: 'marin.processing.classification.fasttext.train_fasttext.train',
      description: 'Train classifier',
      output_path: 'gs://bucket/output/train',
      config: {
        datasets: [
          { input_doc_path: 'gs://bucket/output/prep/docs.jsonl', label: 'good' },
        ],
      },
    },
  ],
};

function statusPayload(status) {
  return {
    type: 'jsonl',
    items: [{ status, date: '2026-01-01T00:00:00Z' }],
  };
}

test('filters experiment steps by status and search', async () => {
  axios.get.mockImplementation((url) => {
    const [, query] = url.split('?');
    const params = new URLSearchParams(query);
    const path = params.get('path');

    if (path === experimentPath) {
      return Promise.resolve({ data: { data: experimentPayload } });
    }
    if (path === 'gs://bucket/output/prep/.executor_status') {
      return Promise.resolve({ data: statusPayload('SUCCESS') });
    }
    if (path === 'gs://bucket/output/train/.executor_status') {
      return Promise.resolve({ data: statusPayload('FAILED') });
    }
    return Promise.resolve({ data: { type: 'jsonl', items: [] } });
  });

  const query = new URLSearchParams({ path: experimentPath }).toString();
  render(
    <MemoryRouter initialEntries={[`/experiment?${query}`]}>
      <Routes>
        <Route path="/experiment" element={<ExperimentPage />} />
      </Routes>
    </MemoryRouter>,
  );

  expect(await screen.findByText('Steps (2)')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /FAILED/i }));
  await waitFor(() => expect(screen.getByText('Steps (1)')).toBeInTheDocument());

  await userEvent.type(screen.getByLabelText('Search steps'), 'missing_step');
  await waitFor(() => expect(screen.getByText('Steps (0)')).toBeInTheDocument());
});
