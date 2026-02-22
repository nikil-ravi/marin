import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useLocation, useNavigate } from 'react-router-dom';
import OpenPathDialog from './components/home/OpenPathDialog';
import RootPathCards from './components/home/RootPathCards';
import { ErrorState, LoadingState } from './components/StateViews';
import { apiConfigUrl, navigateToUrl, checkJsonResponse } from './utils';

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);

  // State
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [openPathDialog, setOpenPathDialog] = useState(false);
  const [openExperimentDialog, setOpenExperimentDialog] = useState(false);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiConfigUrl());
        const payload = checkJsonResponse(response, setError);
        if (!payload) {
          return;
        }
        if (!payload || !Array.isArray(payload.root_paths)) {
          console.error("Invalid /api/config payload:", payload);
          setError("Backend config response is missing root_paths.");
          return;
        }
        setConfig(payload);
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!config) {
    return <LoadingState label="Loading browser configuration..." />;
  }

  function openViewPath(path) {
    navigateToUrl(urlParams, { paths: JSON.stringify([path]), offset: 0 }, { pathname: '/view' }, navigate);
    setOpenPathDialog(false);
  }

  function openExperiment(path) {
    navigateToUrl(urlParams, { path }, { pathname: '/experiment' }, navigate);
    setOpenExperimentDialog(false);
  }

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Stack spacing={0.5}>
            <Typography variant="h5">Start browsing</Typography>
            <Typography variant="body2" color="text.secondary">
              Open root paths, jump to a custom path, or inspect an experiment config.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setOpenPathDialog(true)}>
              Open path
            </Button>
            <Button variant="contained" onClick={() => setOpenExperimentDialog(true)}>
              Open experiment
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <RootPathCards rootPaths={config.root_paths} />

      <OpenPathDialog
        open={openPathDialog}
        title="Open path in Data View"
        description="Enter any local or cloud path (e.g., gs://bucket/path or ../local_store)."
        onClose={() => setOpenPathDialog(false)}
        onSubmit={openViewPath}
      />

      <OpenPathDialog
        open={openExperimentDialog}
        title="Open experiment"
        description="Enter the path to an experiment JSON file."
        onClose={() => setOpenExperimentDialog(false)}
        onSubmit={openExperiment}
      />
    </Stack>
  );
}

export default HomePage;
