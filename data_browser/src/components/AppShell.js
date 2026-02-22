import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const routeTitles = [
  { prefix: '/experiment', title: 'Experiment View', subtitle: 'Inspect pipeline steps, statuses, and outputs' },
  { prefix: '/view', title: 'Data View', subtitle: 'Browse directories, files, and structured records' },
  { prefix: '/', title: 'Data Browser', subtitle: 'Navigate datasets and experiment artifacts' },
];

function getRouteMeta(pathname) {
  return routeTitles.find(({ prefix }) => pathname.startsWith(prefix)) || routeTitles[routeTitles.length - 1];
}

function AppShell({ children, mode, onToggleTheme }) {
  const location = useLocation();
  const meta = getRouteMeta(location.pathname);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar color="transparent" elevation={0} position="sticky" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, justifyContent: 'space-between', minHeight: '64px' }}>
          <Stack direction="row" spacing={2} alignItems="baseline">
            <Typography component={RouterLink} to="/" variant="h6" color="text.primary" sx={{ textDecoration: 'none' }}>
              Marin Data Browser
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.title}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Dark mode
            </Typography>
            <Switch checked={mode === 'dark'} onChange={onToggleTheme} />
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {meta.subtitle}
          </Typography>
          {children}
        </Stack>
      </Container>
    </Box>
  );
}

export default AppShell;
