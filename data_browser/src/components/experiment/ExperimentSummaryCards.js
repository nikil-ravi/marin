import React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from './StatusChip';

function SummaryCard({ title, value, description, extra }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h6">{value}</Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
          {extra}
        </Stack>
      </CardContent>
    </Card>
  );
}

function ExperimentSummaryCards({ createdDate, totalSteps, statusCounts }) {
  const statusItems = Object.entries(statusCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([status, count]) => (
      <Stack direction="row" spacing={1} alignItems="center" key={status}>
        <StatusChip status={status} />
        <Typography variant="body2">{count}</Typography>
      </Stack>
    ));

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Created" value={createdDate} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard title="Total steps" value={totalSteps} />
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <SummaryCard
          title="Status summary"
          value={`${Object.keys(statusCounts).length} states`}
          extra={<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{statusItems}</Stack>}
        />
      </Grid>
    </Grid>
  );
}

export default ExperimentSummaryCards;
