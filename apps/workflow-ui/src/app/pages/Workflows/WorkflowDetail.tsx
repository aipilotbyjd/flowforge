import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Delete,
  Edit,
  NavigateNext,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const WorkflowDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Mock data - in real app this would come from an API
  const workflow = {
    id,
    name: 'Data Processing Pipeline',
    description: 'Processes incoming data from multiple sources',
    status: 'active',
    lastRun: '2024-01-15 10:30',
    nextRun: '2024-01-16 10:30',
    createdAt: '2024-01-10 12:30',
    logs: 'Workflow run completed successfully. Processed 1,245 records in 23 minutes.'
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

  return (
    <Box>
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb">
        <Link color="inherit" onClick={() => navigate('/workflows')} style={{ cursor: 'pointer' }}>
          Workflows
        </Link>
        <Typography color="textPrimary">Details</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} mt={2}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/workflows')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            {workflow.name}
          </Typography>
        </Box>

        <Box>
          <Button
            startIcon={<Edit />}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Edit
          </Button>
          <Button
            startIcon={<Delete />}
            variant="outlined"
            color="error"
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" color="textSecondary">
            {workflow.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box mb={2}>
            <Typography variant="body2" color="textSecondary">
              <strong>Status:</strong> <span style={{ color: getStatusColor(workflow.status) }}>{workflow.status}</span>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Created At:</strong> {workflow.createdAt}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Last Run:</strong> {workflow.lastRun}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Next Run:</strong> {workflow.nextRun}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Logs
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {workflow.logs}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WorkflowDetail;
