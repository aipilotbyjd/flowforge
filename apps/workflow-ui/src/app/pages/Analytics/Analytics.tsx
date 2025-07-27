import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  CheckCircle,
  Error,
  Speed,
  Timeline,
  Assessment,
  Download,
  Refresh,
  FilterList,
  PieChart,
  BarChart,
} from '@mui/icons-material';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface WorkflowPerformance {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  avgDuration: string;
  lastRun: string;
  status: 'active' | 'inactive';
  trend: 'up' | 'down' | 'neutral';
}

interface ExecutionTrend {
  date: string;
  successful: number;
  failed: number;
  total: number;
}

const mockMetrics: MetricCard[] = [
  {
    title: 'Total Executions',
    value: '12,459',
    change: '+12.5%',
    trend: 'up',
    icon: <Schedule />,
    color: '#1976d2',
  },
  {
    title: 'Success Rate',
    value: '94.2%',
    change: '+2.1%',
    trend: 'up',
    icon: <CheckCircle />,
    color: '#2e7d32',
  },
  {
    title: 'Failed Executions',
    value: '724',
    change: '-8.3%',
    trend: 'down',
    icon: <Error />,
    color: '#d32f2f',
  },
  {
    title: 'Avg Duration',
    value: '2m 34s',
    change: '-5.2%',
    trend: 'down',
    icon: <Speed />,
    color: '#ff9800',
  },
];

const mockWorkflowPerformance: WorkflowPerformance[] = [
  {
    id: '1',
    name: 'Email Campaign Automation',
    executions: 2543,
    successRate: 98.2,
    avgDuration: '1m 45s',
    lastRun: '2025-07-27 16:30',
    status: 'active',
    trend: 'up',
  },
  {
    id: '2',
    name: 'Database Backup Process',
    executions: 1876,
    successRate: 89.4,
    avgDuration: '8m 12s',
    lastRun: '2025-07-27 15:00',
    status: 'active',
    trend: 'neutral',
  },
  {
    id: '3',
    name: 'Social Media Posting',
    executions: 1234,
    successRate: 95.7,
    avgDuration: '32s',
    lastRun: '2025-07-27 16:45',
    status: 'active',
    trend: 'up',
  },
  {
    id: '4',
    name: 'Customer Onboarding',
    executions: 987,
    successRate: 92.1,
    avgDuration: '3m 21s',
    lastRun: '2025-07-27 14:20',
    status: 'active',
    trend: 'down',
  },
  {
    id: '5',
    name: 'File Processing Pipeline',
    executions: 654,
    successRate: 87.3,
    avgDuration: '5m 45s',
    lastRun: '2025-07-27 13:15',
    status: 'inactive',
    trend: 'down',
  },
];

const mockExecutionTrends: ExecutionTrend[] = [
  { date: '2025-07-21', successful: 445, failed: 23, total: 468 },
  { date: '2025-07-22', successful: 512, failed: 31, total: 543 },
  { date: '2025-07-23', successful: 389, failed: 19, total: 408 },
  { date: '2025-07-24', successful: 623, failed: 27, total: 650 },
  { date: '2025-07-25', successful: 578, failed: 22, total: 600 },
  { date: '2025-07-26', successful: 634, failed: 18, total: 652 },
  { date: '2025-07-27', successful: 701, failed: 25, total: 726 },
];

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <Timeline color="disabled" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'success';
    if (rate >= 85) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics & Reports
        </Typography>
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1d">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />}>
            Export Report
          </Button>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        {mockMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: metric.color,
                      borderRadius: 1,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {metric.icon}
                  </Box>
                  {getTrendIcon(metric.trend)}
                </Box>
                <Typography variant="h4" component="div" mb={1}>
                  {metric.value}
                </Typography>
                <Typography color="text.secondary" variant="body2" mb={1}>
                  {metric.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: getTrendColor(metric.trend) }}
                >
                  {metric.change} from last period
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Execution Trends Chart Placeholder */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Execution Trends</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label="Successful" color="success" size="small" />
                  <Chip label="Failed" color="error" size="small" />
                </Stack>
              </Box>
              
              {/* Simple chart representation */}
              <Box sx={{ height: 300, position: 'relative' }}>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 10 }}>
                  <BarChart sx={{ fontSize: 48, mb: 2 }} />
                  <br />
                  Chart visualization would be rendered here
                  <br />
                  (Integration with chart library like Chart.js or Recharts)
                </Typography>
                
                {/* Sample data representation */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <Stack spacing={1}>
                    {mockExecutionTrends.slice(-3).map((trend, index) => (
                      <Box key={trend.date} display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" sx={{ minWidth: 80 }}>
                          {new Date(trend.date).toLocaleDateString()}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(trend.successful / trend.total) * 100}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {trend.successful}/{trend.total}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Success Rate Distribution
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box textAlign="center">
                  <PieChart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pie chart visualization
                    <br />
                    would be rendered here
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Workflow Performance Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Workflow Performance</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FilterList color="action" />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter Workflow</InputLabel>
                <Select
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                  label="Filter Workflow"
                >
                  <MenuItem value="all">All Workflows</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="inactive">Inactive Only</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Workflow Name</TableCell>
                  <TableCell align="right">Executions</TableCell>
                  <TableCell align="center">Success Rate</TableCell>
                  <TableCell align="right">Avg Duration</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Trend</TableCell>
                  <TableCell>Last Run</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockWorkflowPerformance
                  .filter(workflow => 
                    selectedWorkflow === 'all' || workflow.status === selectedWorkflow
                  )
                  .map((workflow) => (
                    <TableRow key={workflow.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {workflow.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {workflow.executions.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={workflow.successRate}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                            color={getSuccessRateColor(workflow.successRate)}
                          />
                          <Typography variant="body2">
                            {workflow.successRate}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {workflow.avgDuration}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={workflow.status}
                          color={workflow.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {getTrendIcon(workflow.trend)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(workflow.lastRun).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
