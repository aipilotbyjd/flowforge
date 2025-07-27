import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Refresh,
  Person,
  Computer,
  Edit,
  Delete,
  Add,
  PlayArrow,
  Stop,
  Settings,
  Visibility,
} from '@mui/icons-material';

interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userAvatar?: string;
  action: string;
  resource: string;
  resourceType: 'workflow' | 'user' | 'system' | 'credential' | 'template' | 'trigger';
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

const mockActivityLogs: ActivityLogEntry[] = [
  {
    id: '1',
    timestamp: '2025-07-27 16:45:23',
    user: 'john.doe@company.com',
    action: 'Created',
    resource: 'Email Campaign Workflow',
    resourceType: 'workflow',
    details: 'Created new email campaign automation workflow',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'success',
  },
  {
    id: '2',
    timestamp: '2025-07-27 16:30:15',
    user: 'jane.smith@company.com',
    action: 'Executed',
    resource: 'Database Backup Process',
    resourceType: 'workflow',
    details: 'Manually triggered database backup workflow',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'info',
  },
  {
    id: '3',
    timestamp: '2025-07-27 16:15:08',
    user: 'system',
    action: 'Failed',
    resource: 'API Monitor Workflow',
    resourceType: 'workflow',
    details: 'Workflow execution failed due to timeout',
    ipAddress: '127.0.0.1',
    userAgent: 'FlowForge-System/1.0',
    severity: 'error',
  },
  {
    id: '4',
    timestamp: '2025-07-27 15:45:30',
    user: 'mike.johnson@company.com',
    action: 'Updated',
    resource: 'Gmail SMTP Credentials',
    resourceType: 'credential',
    details: 'Updated SMTP configuration for Gmail integration',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    severity: 'info',
  },
  {
    id: '5',
    timestamp: '2025-07-27 15:30:45',
    user: 'admin@company.com',
    action: 'Deleted',
    resource: 'test.user@company.com',
    resourceType: 'user',
    details: 'Removed user from organization',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    severity: 'warning',
  },
  {
    id: '6',
    timestamp: '2025-07-27 15:15:12',
    user: 'system',
    action: 'Updated',
    resource: 'System Configuration',
    resourceType: 'system',
    details: 'Automated system configuration update applied',
    ipAddress: '127.0.0.1',
    userAgent: 'FlowForge-System/1.0',
    severity: 'info',
  },
  {
    id: '7',
    timestamp: '2025-07-27 14:50:33',
    user: 'sarah.wilson@company.com',
    action: 'Created',
    resource: 'Weekly Report Template',
    resourceType: 'template',
    details: 'Created new workflow template for weekly reports',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    severity: 'success',
  },
  {
    id: '8',
    timestamp: '2025-07-27 14:20:18',
    user: 'system',
    action: 'Started',
    resource: 'Social Media Posting',
    resourceType: 'workflow',
    details: 'Scheduled workflow execution started',
    ipAddress: '127.0.0.1',
    userAgent: 'FlowForge-System/1.0',
    severity: 'info',
  },
];

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'created':
      return <Add color="success" />;
    case 'updated':
      return <Edit color="info" />;
    case 'deleted':
      return <Delete color="error" />;
    case 'executed':
    case 'started':
      return <PlayArrow color="primary" />;
    case 'stopped':
      return <Stop color="warning" />;
    case 'failed':
      return <Delete color="error" />;
    case 'viewed':
      return <Visibility color="info" />;
    default:
      return <Settings color="action" />;
  }
};

const getSeverityColor = (severity: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (severity) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

const getResourceTypeColor = (type: string): 'primary' | 'secondary' | 'default' => {
  switch (type) {
    case 'workflow':
      return 'primary';
    case 'user':
      return 'secondary';
    default:
      return 'default';
  }
};

const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState(mockActivityLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesResourceType = filterResourceType === 'all' || log.resourceType === filterResourceType;
    const matchesUser = filterUser === 'all' || log.user === filterUser;

    return matchesSearch && matchesSeverity && matchesResourceType && matchesUser;
  });

  const uniqueUsers = [...new Set(logs.map(log => log.user))];

  const handleRefresh = () => {
    console.log('Refreshing activity logs...');
    // TODO: Implement actual refresh logic
  };

  const handleExport = () => {
    console.log('Exporting activity logs...');
    // TODO: Implement export functionality
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Activity Log
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
            Export
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <FilterList color="action" />
            <TextField
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, maxWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                label="Severity"
              >
                <MenuItem value="all">All Severity</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={filterResourceType}
                onChange={(e) => setFilterResourceType(e.target.value)}
                label="Resource Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="workflow">Workflow</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="credential">Credential</MenuItem>
                <MenuItem value="template">Template</MenuItem>
                <MenuItem value="trigger">Trigger</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>User</InputLabel>
              <Select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                label="User"
              >
                <MenuItem value="all">All Users</MenuItem>
                {uniqueUsers.map((user) => (
                  <MenuItem key={user} value={user}>
                    {user}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>IP Address</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24 }} src={log.userAvatar}>
                      {log.user === 'system' ? <Computer /> : <Person />}
                    </Avatar>
                    <Typography variant="body2">
                      {log.user}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getActionIcon(log.action)}
                    <Typography variant="body2">
                      {log.action}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {log.resource}
                    </Typography>
                    <Chip
                      label={log.resourceType}
                      size="small"
                      color={getResourceTypeColor(log.resourceType)}
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {log.details}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.severity.toUpperCase()}
                    size="small"
                    color={getSeverityColor(log.severity)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={`User Agent: ${log.userAgent}`}>
                    <Typography variant="body2" color="text.secondary">
                      {log.ipAddress}
                    </Typography>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredLogs.length === 0 && (
        <Box textAlign="center" py={8}>
          <Settings sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No activity logs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterSeverity !== 'all' || filterResourceType !== 'all' || filterUser !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Activity logs will appear here as users interact with the system'
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ActivityLog;
