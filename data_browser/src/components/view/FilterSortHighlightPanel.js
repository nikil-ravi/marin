import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { formatKeyPath, parseKeyPathInput } from '../../hooks/useViewQueryState';

const filterOps = ['=', '!=', '<', '<=', '>', '>=', '=~'];

function parseTypedValue(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && `${asNumber}` === trimmed) {
    return asNumber;
  }
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return trimmed;
  }
}

function FilterSortHighlightPanel({
  filters,
  sort,
  reverse,
  highlights,
  showOnlyHighlights,
  onSetFilters,
  onSetSort,
  onSetReverse,
  onSetHighlights,
  onSetShowOnlyHighlights,
}) {
  const [filterSource, setFilterSource] = useState(0);
  const [filterKeyPath, setFilterKeyPath] = useState('');
  const [filterRel, setFilterRel] = useState('=');
  const [filterValue, setFilterValue] = useState('');
  const [sortSource, setSortSource] = useState(0);
  const [sortPath, setSortPath] = useState('');
  const [highlightSource, setHighlightSource] = useState(0);
  const [highlightPath, setHighlightPath] = useState('');

  const filterError = filters.error || sort.error || highlights.error;
  if (filterError) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography color="error">{filterError}</Typography>
      </Paper>
    );
  }

  function appendFilter() {
    const key = [filterSource, ...parseKeyPathInput(filterKeyPath)];
    const value = parseTypedValue(filterValue);
    const nextFilters = filters.filters.concat([{ key, rel: filterRel, value }]);
    onSetFilters(nextFilters);
    setFilterValue('');
  }

  function appendSort() {
    const key = [sortSource, ...parseKeyPathInput(sortPath)];
    onSetSort(key);
  }

  function appendHighlight() {
    const key = [highlightSource, ...parseKeyPathInput(highlightPath)];
    onSetHighlights(highlights.highlights.concat([key]));
    setHighlightPath('');
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle2">Filters, sorting, and highlights</Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {filters.filters.map((filter, index) => (
            <Chip
              key={`${formatKeyPath(filter.key)}-${filter.rel}-${index}`}
              label={`${formatKeyPath(filter.key)} ${filter.rel} ${JSON.stringify(filter.value)}`}
              onDelete={() => onSetFilters(filters.filters.filter((_, i) => i !== index))}
            />
          ))}
          {filters.filters.length === 0 && <Typography variant="body2" color="text.secondary">No filters</Typography>}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField label="Filter source index" type="number" value={filterSource} onChange={(e) => setFilterSource(Number(e.target.value || 0))} size="small" sx={{ width: 170 }} />
          <TextField label="Filter key path" placeholder="metadata.score" value={filterKeyPath} onChange={(e) => setFilterKeyPath(e.target.value)} size="small" sx={{ minWidth: 200 }} />
          <TextField select label="Op" value={filterRel} onChange={(e) => setFilterRel(e.target.value)} size="small" sx={{ width: 100 }}>
            {filterOps.map((op) => (
              <MenuItem key={op} value={op}>{op}</MenuItem>
            ))}
          </TextField>
          <TextField label="Value" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} size="small" sx={{ minWidth: 180 }} />
          <Button variant="outlined" onClick={appendFilter}>Add filter</Button>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Chip
            label={
              sort.key
                ? `Sort: ${formatKeyPath(sort.key)} (${reverse ? 'desc' : 'asc'})`
                : 'No sort'
            }
            onDelete={sort.key ? () => {
              onSetSort(null);
              onSetReverse(false);
            } : undefined}
          />
          <Switch checked={reverse} onChange={(e) => onSetReverse(e.target.checked)} />
          <Typography variant="body2" color="text.secondary">Descending</Typography>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField label="Sort source index" type="number" value={sortSource} onChange={(e) => setSortSource(Number(e.target.value || 0))} size="small" sx={{ width: 170 }} />
          <TextField label="Sort key path" placeholder="metrics.loss" value={sortPath} onChange={(e) => setSortPath(e.target.value)} size="small" sx={{ minWidth: 200 }} />
          <Button variant="outlined" onClick={appendSort}>Set sort key</Button>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Switch checked={showOnlyHighlights} onChange={(e) => onSetShowOnlyHighlights(e.target.checked)} />
          <Typography variant="body2" color="text.secondary">Show only highlighted branches</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {highlights.highlights.map((highlight, index) => (
            <Chip
              key={`${formatKeyPath(highlight)}-${index}`}
              label={formatKeyPath(highlight)}
              onDelete={() => onSetHighlights(highlights.highlights.filter((_, i) => i !== index))}
            />
          ))}
          {highlights.highlights.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No highlights
            </Typography>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
          <TextField label="Highlight source index" type="number" value={highlightSource} onChange={(e) => setHighlightSource(Number(e.target.value || 0))} size="small" sx={{ width: 170 }} />
          <TextField label="Highlight key path" placeholder="text" value={highlightPath} onChange={(e) => setHighlightPath(e.target.value)} size="small" sx={{ minWidth: 200 }} />
          <Button variant="outlined" onClick={appendHighlight}>Add highlight</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default FilterSortHighlightPanel;
