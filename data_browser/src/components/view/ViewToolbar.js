import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

function ViewToolbar({
  offset,
  count,
  actualCount,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onApplyWindow,
  onRefresh,
}) {
  const [draftOffset, setDraftOffset] = useState(offset);
  const [draftCount, setDraftCount] = useState(count);

  useEffect(() => {
    setDraftOffset(offset);
  }, [offset]);

  useEffect(() => {
    setDraftCount(count);
  }, [count]);

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Typography variant="subtitle2">
            Showing rows {offset} to {offset + actualCount} ({actualCount} loaded)
          </Typography>
          <Button variant="text" onClick={onRefresh}>
            Refresh
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField
            label="Offset"
            type="number"
            value={draftOffset}
            onChange={(e) => setDraftOffset(Number.parseInt(e.target.value || '0', 10) || 0)}
            size="small"
            sx={{ width: 150 }}
          />
          <TextField
            label="Count"
            type="number"
            value={draftCount}
            onChange={(e) => setDraftCount(Number.parseInt(e.target.value || '1', 10) || 1)}
            size="small"
            sx={{ width: 150 }}
          />
          <Button
            variant="outlined"
            onClick={() => onApplyWindow(Math.max(0, draftOffset), Math.max(1, draftCount))}
          >
            Apply
          </Button>
          <ButtonGroup variant="outlined">
            <Button disabled={!canGoPrev} onClick={onPrev}>
              Prev
            </Button>
            <Button disabled={!canGoNext} onClick={onNext}>
              Next
            </Button>
          </ButtonGroup>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default ViewToolbar;
