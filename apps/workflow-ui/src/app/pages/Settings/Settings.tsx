import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
} from '@mui/material';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    autoSave: true,
    defaultWorkflowTimeout: '30',
    maxConcurrentWorkflows: '5'
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Save settings to API
    console.log('Saving settings:', settings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: false,
      darkMode: false,
      autoSave: true,
      defaultWorkflowTimeout: '30',
      maxConcurrentWorkflows: '5'
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Top row with Notifications and Appearance */}
        <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
          {/* Notification Settings */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSwitchChange('emailNotifications')}
                    />
                  }
                  label="Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleSwitchChange('pushNotifications')}
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appearance
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSwitchChange('darkMode')}
                    />
                  }
                  label="Dark Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoSave}
                      onChange={handleSwitchChange('autoSave')}
                    />
                  }
                  label="Auto Save"
                />
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* Workflow Settings */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Configuration
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <TextField
                fullWidth
                label="Default Workflow Timeout (minutes)"
                type="number"
                value={settings.defaultWorkflowTimeout}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('defaultWorkflowTimeout', e.target.value)}
                helperText="Default timeout for workflow execution"
              />
              <TextField
                fullWidth
                label="Max Concurrent Workflows"
                type="number"
                value={settings.maxConcurrentWorkflows}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('maxConcurrentWorkflows', e.target.value)}
                helperText="Maximum number of workflows that can run simultaneously"
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleSave}
        >
          Save Settings
        </Button>
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          Reset to Defaults
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;
