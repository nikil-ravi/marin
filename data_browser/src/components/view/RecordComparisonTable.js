import React from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

function RecordComparisonTable({ pathGroups, rowIndices, offset, renderItem }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Aligned records</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 120 }}>Row</TableCell>
              {pathGroups.map(({ path }) => (
                <TableCell key={path} sx={{ wordBreak: 'break-all' }}>
                  {path}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rowIndices.map((rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>[{offset + rowIndex}]</TableCell>
                {pathGroups.map(({ path, index, items }) => (
                  <TableCell key={`${path}-${rowIndex}`} sx={{ minWidth: 280 }}>
                    {renderItem(items[rowIndex], [index])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </Paper>
  );
}

export default RecordComparisonTable;
