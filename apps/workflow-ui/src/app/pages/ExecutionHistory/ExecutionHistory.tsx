import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack,
  Tooltip,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  FilterList,
  Download,
  PlayArrow,
  Stop,
  Error,
  CheckCircle,
  Schedule,
  Pending,
} from '@mui/icons-material';

interface Execution {
  id: string;
  workflow: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration: string;
  trigger: string;
  executedBy: string;
  progress?: number;
  logs?: string;
  errorMessage?: string;
}

const mockExecutions: Execution[] = [
  {
    id: '1',
    workflow: 'Email Campaign Automation',
    status: 'success',
    startedAt: '2025-07-27 14:30:00',
    completedAt: '2025-07-27 14:35:00',
    duration: '5m 12s',
    trigger: 'Manual',
    executedBy: 'john.doe@example.com',
  },
  {
    id: '2',
    workflow: 'Database Backup Process',
    status: 'failed',
    startedAt: '2025-07-27 13:00:00',
    completedAt: '2025-07-27 13:12:00',
    duration: '12m 45s',
    trigger: 'Scheduled',
    executedBy: 'system',
    errorMessage: 'Connection timeout to database server',
  },
  {
    id: '3',
    workflow: 'Social Media Posting',
    status: 'running',
    startedAt: '2025-07-27 16:45:00',
    duration: '2m 30s',
    trigger: 'Webhook',
    executedBy: 'webhook-system',
    progress: 65,
  },
  {
    id: '4',
    workflow: 'Customer Onboarding Flow',
    status: 'success',
    startedAt: '2025-07-27 11:20:00',
    completedAt: '2025-07-27 11:23:00',
    duration: '3m 15s',
    trigger: 'API Call',
    executedBy: 'api-service',
  },
  {
    id: '5',
    workflow: 'File Processing Pipeline',
    status: 'pending',
    startedAt: '2025-07-27 16:50:00',
    duration: '0s',
    trigger: 'Manual',
    executedBy: 'jane.smith@example.com',
  },
  {
    id: '6',
    workflow: 'Weekly Report Generation',
    status: 'cancelled',
    startedAt: '2025-07-27 10:00:00',
    completedAt: '2025-07-27 10:05:00',
    duration: '5m 00s',
    trigger: 'Scheduled',
    executedBy: 'admin@example.com',
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle color="success" />;
    case 'failed':
      return <Error color="error" />;
    case 'running':
      return <PlayArrow color="primary" />;
    case 'pending':
      return <Pending color="warning" />;
    case 'cancelled':
      return <Stop color="disabled" />;
    default:
      return <Schedule />;
  }
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'success':
      return 'success';
    case 'failed':
      return 'error';
    case 'running':
      return 'info';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

const ExecutionHistory: React.FC = () => {
  const [executions, setExecutions] = useState(mockExecutions);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWorkflow, setFilterWorkflow] = useState('');

  const filteredExecutions = executions.filter(execution => {
    const matchesStatus = filterStatus === 'all' || execution.status === filterStatus;
    const matchesWorkflow = filterWorkflow === '' || 
      execution.workflow.toLowerCase().includes(filterWorkflow.toLowerCase());
    return matchesStatus && matchesWorkflow;
  });

  const statusCounts = executions.reduce((acc, execution) => {
    acc[execution.status] = (acc[execution.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleRefresh = () => {
    console.log('Refreshing execution history...');
    // TODO: Implement actual refresh logic
  };

  const handleViewDetails = (executionId: string) => {
    console.log('Viewing execution details:', executionId);
    // TODO: Navigate to execution details page
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Execution History
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Download />}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total
                  </Typography>
                  <Typography variant="h4">
                    {executions.length}
                  </Typography>
                </Box>
                <Schedule color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Success
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statusCounts.success || 0}
                  </Typography>
                </Box>
                <CheckCircle color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Failed
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {statusCounts.failed || 0}
                  </Typography>
                </Box>
                <Error color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Running
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {statusCounts.running || 0}
                  </Typography>
                </Box>
                <PlayArrow color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {statusCounts.pending || 0}
                  </Typography>
                </Box>
                <Pending color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FilterList color="action" />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            label="Search Workflow"
            value={filterWorkflow}
            onChange={(e) => setFilterWorkflow(e.target.value)}
            size="small"
            placeholder="Type to search..."
            sx={{ flexGrow: 1, maxWidth: 300 }}
          />
        </Stack>
      </Paper>

      {/* Executions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workflow</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Trigger</TableCell>
              <TableCell>Executed By</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExecutions.map((execution) => (
              <TableRow key={execution.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {execution.workflow}
                  </Typography>
                  {execution.errorMessage && (
                    <Typography variant="caption" color="error">
                      {execution.errorMessage}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getStatusIcon(execution.status)}
                    <Chip
                      label={execution.status.toUpperCase()}
                      color={getStatusColor(execution.status)}
                      size="small"
                    />
                  </Box>
                  {execution.status === 'running' && execution.progress && (
                    <Box mt={1}>
                      <LinearProgress 
                        variant="determinate" 
                        value={execution.progress} 
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {execution.progress}%
                      </Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(execution.startedAt).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {execution.duration}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={execution.trigger} 
                    variant="outlined" 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {execution.executedBy}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="View Details">
                    <IconButton 
                      size="small"
                      onClick={() => handleViewDetails(execution.id)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredExecutions.length === 0 && (
        <Box textAlign="center" py={8}>
          <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No executions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus !== 'all' || filterWorkflow ? 
              'Try adjusting your filters' : 
              'Workflow executions will appear here'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ExecutionHistory;

