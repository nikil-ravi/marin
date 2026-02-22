import React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 ** 2) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 ** 3) {
    return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 ** 3)).toFixed(1)} GB`;
}

function DirectoryTable({ title, files, onOpenPath }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Modified</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow
              key={file.path}
              hover
              onClick={() => onOpenPath(file.path)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell sx={{ wordBreak: 'break-word' }}>{file.name}</TableCell>
              <TableCell>{file.type || 'file'}</TableCell>
              <TableCell>{formatBytes(file.size)}</TableCell>
              <TableCell>{file.mtime || file.updated || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default DirectoryTable;
