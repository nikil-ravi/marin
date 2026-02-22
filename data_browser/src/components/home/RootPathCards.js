import React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { apiViewUrl, viewSingleUrl } from '../../utils';

function RootPathCards({ rootPaths }) {
  async function copyPath(path) {
    await navigator.clipboard.writeText(path);
  }

  return (
    <Grid container spacing={2}>
      {rootPaths.map((path) => (
        <Grid key={path} size={{ xs: 12, md: 6, lg: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Root path</Typography>
                <Tooltip title={path}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {path}
                  </Typography>
                </Tooltip>
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button href={viewSingleUrl(path)}>Browse</Button>
              <Button href={viewSingleUrl(path)} target="_blank" rel="noreferrer">
                Open JSON
              </Button>
              <Button onClick={() => copyPath(path)}>Copy path</Button>
              <Button href={apiViewUrl({ path })} target="_blank" rel="noreferrer">
                API
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default RootPathCards;
