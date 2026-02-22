import React from 'react';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function LoadingState({ lines = 3, label = 'Loading data...' }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={24} />
        ))}
      </Stack>
    </Paper>
  );
}

export function EmptyState({ title, body }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function ErrorState({ message }) {
  return <Alert severity="error">{message}</Alert>;
}
