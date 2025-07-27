import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from '@mui/material';
import {
  Schedule,
  Webhook,
  Email,
  Storage,
  MoreVert,
  PlayArrow,
  Pause,
  Edit,
  Delete,
} from '@mui/icons-material';

interface Trigger {
  id: string;
  name: string;
  type: 'webhook' | 'schedule' | 'email' | 'database';
  workflow: string;
  status: 'active' | 'inactive';
  lastTriggered?: string;
  description: string;
}

const mockTriggers: Trigger[] = [
  {
    id: '1',
    name: 'Customer Signup Webhook',
    type: 'webhook',
    workflow: 'Welcome Email Flow',
    status: 'active',
    lastTriggered: '2025-07-27 14:30',
    description: 'Triggered when a new customer signs up',
  },
  {
    id: '2',
    name: 'Daily Report Schedule',
    type: 'schedule',
    workflow: 'Daily Analytics Report',
    status: 'active',
    lastTriggered: '2025-07-27 09:00',
    description: 'Runs every day at 9 AM',
  },
  {
    id: '3',
    name: 'Support Email Monitor',
    type: 'email',
    workflow: 'Support Ticket Creation',
    status: 'inactive',
    description: 'Monitors support inbox for new emails',
  },
  {
    id: '4',
    name: 'Database Change Trigger',
    type: 'database',
    workflow: 'Data Sync Process',
    status: 'active',
    lastTriggered: '2025-07-27 16:45',
    description: 'Triggered on database table changes',
  },
];

const getTriggerIcon = (type: string) => {
  switch (type) {
    case 'webhook':
      return <Webhook />;
    case 'schedule':
      return <Schedule />;
    case 'email':
      return <Email />;
    case 'database':
      return <Storage />;
    default:
      return <Webhook />;
  }
};

const getTriggerColor = (type: string) => {
  switch (type) {
    case 'webhook':
      return '#4ecdc4';
    case 'schedule':
      return '#9b59b6';
    case 'email':
      return '#f39c12';
    case 'database':
      return '#45b7d1';
    default:
      return '#4ecdc4';
  }
};

const Triggers: React.FC = () => {
  const [triggers, setTriggers] = useState(mockTriggers);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, triggerId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrigger(triggerId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrigger(null);
  };

  const toggleTriggerStatus = (triggerId: string) => {
    setTriggers(prev =>
      prev.map(trigger =>
        trigger.id === triggerId
          ? { ...trigger, status: trigger.status === 'active' ? 'inactive' : 'active' }
          : trigger
      )
    );
  };

  const handleDeleteTrigger = () => {
    if (selectedTrigger) {
      setTriggers(prev => prev.filter(trigger => trigger.id !== selectedTrigger));
    }
    handleMenuClose();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Triggers
        </Typography>
        <Button variant="contained" color="primary">
          Create New Trigger
        </Button>
      </Box>

      <Grid container spacing={3}>
        {triggers.map((trigger) => (
          <Grid item xs={12} md={6} lg={4} key={trigger.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        backgroundColor: getTriggerColor(trigger.type),
                        borderRadius: 1,
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {getTriggerIcon(trigger.type)}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {trigger.name}
                      </Typography>
                      <Chip
                        label={trigger.type}
                        size="small"
                        variant="outlined"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                  <IconButton
                    onClick={(e) => handleMenuClick(e, trigger.id)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {trigger.description}
                </Typography>

                <Stack spacing={1} mb={2}>
                  <Typography variant="body2">
                    <strong>Workflow:</strong> {trigger.workflow}
                  </Typography>
                  {trigger.lastTriggered && (
                    <Typography variant="body2">
                      <strong>Last Triggered:</strong> {trigger.lastTriggered}
                    </Typography>
                  )}
                </Stack>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={trigger.status === 'active'}
                        onChange={() => toggleTriggerStatus(trigger.id)}
                        color="primary"
                      />
                    }
                    label={trigger.status === 'active' ? 'Active' : 'Inactive'}
                  />
                  <Chip
                    label={trigger.status}
                    color={trigger.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {triggers.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No triggers configured
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Create your first trigger to automate workflow execution
          </Typography>
          <Button variant="contained" color="primary">
            Create Trigger
          </Button>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PlayArrow fontSize="small" sx={{ mr: 1 }} />
          Test Trigger
        </MenuItem>
        <MenuItem onClick={handleDeleteTrigger} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Triggers;
