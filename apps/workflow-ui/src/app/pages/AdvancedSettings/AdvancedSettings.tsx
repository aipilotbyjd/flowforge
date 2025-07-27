import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  Delete,
  DeleteForever,
  Tune,
  Save,
  CloudUpload,
  CloudDownload,
  DeleteSweep,
  Backup,
  Restore,
} from '@mui/icons-material';

const mockDataProtectionSettings = [
  {
    id: '1',
    name: 'Enable Automated Data Backup',
    description: 'Automatically back up workflows daily.',
    enabled: true,
  },
  {
    id: '2',
    name: 'Enable Version Control',
    description: 'Keep track of changes and revert if necessary.',
    enabled: false,
  },
  {
    id: '3',
    name: 'Monthly Data Audit',
    description: 'Perform regular audits to ensure data integrity.',
    enabled: true,
  },
  {
    id: '4',
    name: 'Data Encryption at Rest',
    description: 'All data stored is encrypted for security.',
    enabled: true,
  },
];

const Settings: React.FC = () => {
  const [settings, setSettings] = React.useState(mockDataProtectionSettings);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {/* Data Protection Settings */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Protection
          </Typography>
          <List>
            {settings.map((setting) => (
              <React.Fragment key={setting.id}>
                <ListItem
                  secondaryAction={
                    <Switch
                      edge="end"
                      checked={setting.enabled}
                      onChange={() => toggleSetting(setting.id)}
                      color="primary"
                    />
                  }
                >
                  <ListItemText
                    primary={setting.name}
                    secondary={setting.description}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
      
      {/* Backup and Restore */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Backup Workflows
                </Typography>
                <Tooltip title="Backup all current workflows">
                  <IconButton>
                    <Backup />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button variant="contained" color="primary" startIcon={<CloudUpload />} fullWidth>
                Backup Now
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Restore Workflows
                </Typography>
                <Tooltip title="Restore workflows from a previous backup">
                  <IconButton>
                    <Restore />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button variant="outlined" color="primary" startIcon={<CloudDownload />} fullWidth>
                Restore
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;

