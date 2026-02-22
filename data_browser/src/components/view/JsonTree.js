import React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function copyText(value) {
  navigator.clipboard.writeText(value);
}

function formatPrimitive(value) {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function JsonNode({ value, keyPath = [], depth = 0 }) {
  if (value === null || typeof value !== 'object') {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {formatPrimitive(value)}
        </Typography>
        <Button size="small" onClick={() => copyText(formatPrimitive(value))}>
          Copy
        </Button>
      </Stack>
    );
  }

  const entries = Array.isArray(value) ? value.map((item, i) => [i, item]) : Object.entries(value);
  return (
    <Stack spacing={0.5} sx={{ pl: depth > 0 ? 1.5 : 0, borderLeft: depth > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
      {entries.map(([key, child]) => {
        const childPath = keyPath.concat([key]);
        const summary = `${Array.isArray(value) ? `[${key}]` : key}`;
        const expandable = child !== null && typeof child === 'object';

        if (!expandable) {
          return (
            <Stack key={childPath.join('.')} direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">{summary}:</Typography>
              <JsonNode value={child} keyPath={childPath} depth={depth + 1} />
            </Stack>
          );
        }

        return (
          <details key={childPath.join('.')} open={depth < 1}>
            <summary>
              <Typography component="span" variant="body2" color="text.secondary">
                {summary}
              </Typography>
            </summary>
            <JsonNode value={child} keyPath={childPath} depth={depth + 1} />
          </details>
        );
      })}
    </Stack>
  );
}

function JsonTree({ title, value }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        {title && <Typography variant="subtitle2">{title}</Typography>}
        <JsonNode value={value} />
      </Stack>
    </Paper>
  );
}

export default JsonTree;
