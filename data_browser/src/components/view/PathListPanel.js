import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

function PathRow({ index, path, payload, onApplyPath, onClonePath, onRemovePath }) {
  const [draftPath, setDraftPath] = useState(path);

  useEffect(() => {
    setDraftPath(path);
  }, [path]);

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      spacing={1}
      alignItems={{ xs: 'stretch', lg: 'center' }}
      sx={{ width: '100%' }}
    >
      <TextField
        fullWidth
        size="small"
        value={draftPath}
        onChange={(e) => setDraftPath(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onApplyPath(index, draftPath.trim());
          }
        }}
      />
      <ButtonGroup variant="outlined">
        <Button onClick={() => onApplyPath(index, draftPath.trim())} disabled={draftPath.trim().length === 0}>
          Update
        </Button>
        <Button onClick={() => onClonePath(path)}>Clone</Button>
        <Button onClick={() => onRemovePath(index)}>Remove</Button>
      </ButtonGroup>
      {payload?.type !== 'directory' && (
        <Button
          href={`/api/download?path=${encodeURIComponent(path)}`}
          download={path.split('/').pop()}
          variant="text"
        >
          Download
        </Button>
      )}
    </Stack>
  );
}

function PathListPanel({ paths, payloads, onApplyPath, onClonePath, onRemovePath, onAddPath }) {
  const [newPath, setNewPath] = useState('');

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Paths</Typography>
        {paths.map((path, index) => (
          <PathRow
            key={`${path}-${index}`}
            index={index}
            path={path}
            payload={payloads[path]}
            onApplyPath={onApplyPath}
            onClonePath={onClonePath}
            onRemovePath={onRemovePath}
          />
        ))}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            fullWidth
            size="small"
            label="Add path"
            placeholder="gs://bucket/path or ../local_store"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPath.trim()) {
                onAddPath(newPath.trim());
                setNewPath('');
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              if (!newPath.trim()) {
                return;
              }
              onAddPath(newPath.trim());
              setNewPath('');
            }}
          >
            Add path
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default PathListPanel;
