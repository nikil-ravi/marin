import React from 'react';
import Chip from '@mui/material/Chip';

const statusColorByKey = {
  SUCCESS: 'success',
  FAILED: 'error',
  RUNNING: 'info',
  WAITING: 'warning',
  LOADING: 'default',
  ERROR: 'error',
  UNKNOWN: 'default',
};

const statusIconByKey = {
  SUCCESS: '✅',
  FAILED: '❌',
  RUNNING: '🏃',
  WAITING: '🧍',
  LOADING: '⏳',
  ERROR: '⚠️',
  UNKNOWN: '❔',
};

function StatusChip({ status, size = 'small' }) {
  const normalized = status || 'UNKNOWN';
  const color = statusColorByKey[normalized] || 'default';
  const icon = statusIconByKey[normalized] || statusIconByKey.UNKNOWN;
  return <Chip size={size} color={color} label={`${icon} ${normalized}`} />;
}

export default StatusChip;
