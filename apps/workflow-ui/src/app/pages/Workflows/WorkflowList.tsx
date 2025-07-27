import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add,
  MoreVert,
  Search,
  PlayArrow,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);

  // Mock data - in real app this would come from API
  const workflows = [
    {
      id: 1,
      name: 'Data Processing Pipeline',
      description: 'Processes incoming data from multiple sources',
      status: 'active',
      lastRun: '2024-01-15 10:30',
      nextRun: '2024-01-16 10:30',
      createdAt: '2024-01-10'
    },
    {
      id: 2,
      name: 'Email Notification Flow',
      description: 'Sends automated email notifications',
      status: 'paused',
      lastRun: '2024-01-14 09:15',
      nextRun: '-',
      createdAt: '2024-01-08'
    },
    {
      id: 3,
      name: 'File Backup Workflow',
      description: 'Daily backup of important files',
      status: 'failed',
      lastRun: '2024-01-15 02:00',
      nextRun: '2024-01-16 02:00',
      createdAt: '2024-01-05'
    }
  ];

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workflowId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedWorkflow(workflowId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedWorkflow(null);
  };

  const handleViewWorkflow = (id: number) => {
    navigate(`/workflows/${id}`);
    handleMenuClose();
  };

  const handleEditWorkflow = (id: number) => {
    // TODO: Navigate to edit page
    console.log('Edit workflow:', id);
    handleMenuClose();
  };

  const handleDeleteWorkflow = (id: number) => {
    // TODO: Show confirmation dialog and delete
    console.log('Delete workflow:', id);
    handleMenuClose();
  };

  const handleRunWorkflow = (id: number) => {
    // TODO: Run workflow
    console.log('Run workflow:', id);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Workflows
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/workflows/new')}
        >
          Create Workflow
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Next Run</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorkflows.map((workflow) => (
              <TableRow key={workflow.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">
                    {workflow.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {workflow.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={workflow.status}
                    color={getStatusColor(workflow.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{workflow.lastRun}</TableCell>
                <TableCell>{workflow.nextRun}</TableCell>
                <TableCell>{workflow.createdAt}</TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, workflow.id)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedWorkflow && handleViewWorkflow(selectedWorkflow)}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => selectedWorkflow && handleEditWorkflow(selectedWorkflow)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedWorkflow && handleRunWorkflow(selectedWorkflow)}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Run Now
        </MenuItem>
        <MenuItem onClick={() => selectedWorkflow && handleDeleteWorkflow(selectedWorkflow)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WorkflowList;
