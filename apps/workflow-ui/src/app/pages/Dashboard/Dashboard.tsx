import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  CheckCircle,
  Error,
  Schedule
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  // Mock data - in real app this would come from API
  const stats = {
    totalWorkflows: 24,
    runningWorkflows: 3,
    completedWorkflows: 18,
    failedWorkflows: 3
  };

  const recentWorkflows = [
    {
      id: 1,
      name: 'Data Processing Pipeline',
      status: 'running',
      lastRun: '2 minutes ago'
    },
    {
      id: 2,
      name: 'Email Notification Flow',
      status: 'completed',
      lastRun: '15 minutes ago'
    },
    {
      id: 3,
      name: 'File Backup Workflow',
      status: 'failed',
      lastRun: '1 hour ago'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayArrow color="primary" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'failed':
        return <Error color="error" />;
      case 'paused':
        return <Pause color="warning" />;
      default:
        return <Schedule color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Overview */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h3" color="primary">
            {stats.totalWorkflows}
          </Typography>
          <Typography variant="subtitle1">Total Workflows</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h3" color="primary">
            {stats.runningWorkflows}
          </Typography>
          <Typography variant="subtitle1">Running</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h3" color="success.main">
            {stats.completedWorkflows}
          </Typography>
          <Typography variant="subtitle1">Completed</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
          <Typography variant="h3" color="error.main">
            {stats.failedWorkflows}
          </Typography>
          <Typography variant="subtitle1">Failed</Typography>
        </Paper>
      </Stack>

      {/* Recent Workflows */}
      <Typography variant="h5" component="h2" gutterBottom>
        Recent Workflows
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {recentWorkflows.map((workflow) => (
          <Card key={workflow.id} sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getStatusIcon(workflow.status)}
                <Typography variant="h6" component="h3">
                  {workflow.name}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={workflow.status}
                  color={getStatusColor(workflow.status) as any}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {workflow.lastRun}
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small">View Details</Button>
              <Button size="small">Edit</Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default Dashboard;
