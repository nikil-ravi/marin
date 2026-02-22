import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

function OpenPathDialog({ open, title, description, initialPath = '', onClose, onSubmit }) {
  const [path, setPath] = useState(initialPath);
  const isValid = path.trim().length > 0;

  useEffect(() => {
    if (open) {
      setPath(initialPath || '');
    }
  }, [open, initialPath]);

  function submit() {
    if (!isValid) {
      return;
    }
    onSubmit(path.trim());
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submit();
              }
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!isValid}>
          Open
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default OpenPathDialog;
