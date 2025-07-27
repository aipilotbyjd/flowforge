import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Key,
  Security,
  Cloud,
  Email,
  Storage,
} from '@mui/icons-material';

interface Credential {
  id: string;
  name: string;
  type: string;
  service: string;
  icon: React.ReactNode;
  color: string;
  lastUsed?: string;
  isActive: boolean;
  description: string;
}

const mockCredentials: Credential[] = [
  {
    id: '1',
    name: 'Gmail SMTP',
    type: 'smtp',
    service: 'Gmail',
    icon: <Email />,
    color: '#ea4335',
    lastUsed: '2025-07-27 14:30',
    isActive: true,
    description: 'SMTP credentials for sending emails via Gmail',
  },
  {
    id: '2',
    name: 'AWS S3 Bucket',
    type: 'aws',
    service: 'Amazon S3',
    icon: <Cloud />,
    color: '#ff9900',
    lastUsed: '2025-07-26 09:15',
    isActive: true,
    description: 'AWS credentials for file storage operations',
  },
  {
    id: '3',
    name: 'Database Connection',
    type: 'database',
    service: 'MySQL',
    icon: <Storage />,
    color: '#4479a1',
    lastUsed: '2025-07-27 16:22',
    isActive: true,
    description: 'Database connection for data operations',
  },
  {
    id: '4',
    name: 'API Key - Analytics',
    type: 'api_key',
    service: 'Custom API',
    icon: <Key />,
    color: '#6c757d',
    isActive: false,
    description: 'API key for external analytics service',
  },
];

const credentialTypes = [
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth2' },
  { value: 'basic_auth', label: 'Basic Auth' },
  { value: 'smtp', label: 'SMTP' },
  { value: 'database', label: 'Database' },
  { value: 'aws', label: 'AWS' },
  { value: 'custom', label: 'Custom' },
];

const Credentials: React.FC = () => {
  const [credentials, setCredentials] = useState(mockCredentials);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showValues, setShowValues] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    service: '',
    description: '',
    apiKey: '',
    apiSecret: '',
    username: '',
    password: '',
  });

  const handleOpenDialog = (credential?: Credential) => {
    if (credential) {
      setEditingCredential(credential);
      setFormData({
        name: credential.name,
        type: credential.type,
        service: credential.service,
        description: credential.description,
        apiKey: '',
        apiSecret: '',
        username: '',
        password: '',
      });
    } else {
      setEditingCredential(null);
      setFormData({
        name: '',
        type: '',
        service: '',
        description: '',
        apiKey: '',
        apiSecret: '',
        username: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCredential(null);
  };

  const handleSaveCredential = () => {
    if (editingCredential) {
      // Update existing credential
      setCredentials(prev =>
        prev.map(cred =>
          cred.id === editingCredential.id
            ? { ...cred, ...formData }
            : cred
        )
      );
    } else {
      // Create new credential
      const newCredential: Credential = {
        id: Date.now().toString(),
        name: formData.name,
        type: formData.type,
        service: formData.service,
        description: formData.description,
        icon: <Key />,
        color: '#6c757d',
        isActive: true,
      };
      setCredentials(prev => [...prev, newCredential]);
    }
    handleCloseDialog();
  };

  const handleDeleteCredential = (credentialId: string) => {
    setCredentials(prev => prev.filter(cred => cred.id !== credentialId));
  };

  const toggleShowValue = (credentialId: string) => {
    setShowValues(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Credentials
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Credential
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Credentials are encrypted and stored securely. They can only be used by workflows you create.
      </Alert>

      <Grid container spacing={3}>
        {credentials.map((credential) => (
          <Grid item xs={12} md={6} key={credential.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        backgroundColor: credential.color,
                        borderRadius: 1,
                        p: 1,
                        mr: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {credential.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="h3">
                        {credential.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {credential.service}
                      </Typography>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(credential)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteCredential(credential.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {credential.description}
                </Typography>

                <Stack spacing={1}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">
                      <strong>Type:</strong> {credential.type.toUpperCase()}
                    </Typography>
                    <Chip
                      label={credential.isActive ? 'Active' : 'Inactive'}
                      color={credential.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  {credential.lastUsed && (
                    <Typography variant="body2">
                      <strong>Last Used:</strong> {credential.lastUsed}
                    </Typography>
                  )}
                </Stack>

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Button size="small" variant="outlined">
                    Test Connection
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => toggleShowValue(credential.id)}
                  >
                    {showValues[credential.id] ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {credentials.length === 0 && (
        <Box textAlign="center" py={8}>
          <Security sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No credentials configured
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add your first credential to connect external services
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Credential
          </Button>
        </Box>
      )}

      {/* Add/Edit Credential Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCredential ? 'Edit Credential' : 'Add New Credential'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Gmail SMTP"
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                label="Type"
              >
                {credentialTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Service"
              value={formData.service}
              onChange={(e) => handleInputChange('service', e.target.value)}
              placeholder="e.g., Gmail, AWS, Custom API"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder="Brief description of this credential"
            />
            {formData.type === 'api_key' && (
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            )}
            {formData.type === 'basic_auth' && (
              <>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCredential}
            variant="contained"
            disabled={!formData.name || !formData.type}
          >
            {editingCredential ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Credentials;
