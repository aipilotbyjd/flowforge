import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Stack
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Profile: React.FC = () => {
  const { state } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Admin',
    joinDate: '2024-01-01'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // TODO: Save profile changes to API
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      joinDate: '2024-01-01'
    });
    setIsEditing(false);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Stack spacing={3} direction={{ xs: 'column', md: 'row' }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              <Person sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {formData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.role}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {formData.joinDate}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flexGrow: 1 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Profile Information
              </Typography>
              {!isEditing && (
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
              />
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                variant={isEditing ? 'outlined' : 'filled'}
              />
              <TextField
                fullWidth
                label="Role"
                value={formData.role}
                disabled
                variant="filled"
              />
              <TextField
                fullWidth
                label="Join Date"
                value={formData.joinDate}
                disabled
                variant="filled"
              />
            </Stack>

            {isEditing && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default Profile;
