import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
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
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  Group,
  AdminPanelSettings,
  Visibility,
  Block,
  Email,
  Business,
  Settings,
  People,
  Security,
  Analytics,
} from '@mui/icons-material';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  status: 'active' | 'invited' | 'inactive';
  lastActive: string;
  permissions: string[];
}

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  workflowCount: number;
  color: string;
  members: TeamMember[];
}

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Marketing Team',
    description: 'Handles all marketing automation workflows',
    memberCount: 5,
    workflowCount: 12,
    color: '#f39c12',
    members: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'admin',
        status: 'active',
        lastActive: '2025-07-27 16:30',
        permissions: ['create', 'edit', 'delete', 'manage_users'],
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'editor',
        status: 'active',
        lastActive: '2025-07-27 15:20',
        permissions: ['create', 'edit'],
      },
    ],
  },
  {
    id: '2',
    name: 'DevOps Team',
    description: 'Infrastructure and deployment workflows',
    memberCount: 3,
    workflowCount: 8,
    color: '#27ae60',
    members: [
      {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        role: 'admin',
        status: 'active',
        lastActive: '2025-07-27 17:00',
        permissions: ['create', 'edit', 'delete', 'manage_users'],
      },
    ],
  },
];

const mockOrgStats = {
  totalMembers: 15,
  activeWorkflows: 25,
  monthlyExecutions: 1250,
  storageUsed: '2.3 GB',
};

const roleColors = {
  admin: 'error',
  editor: 'warning',
  viewer: 'info',
} as const;

const statusColors = {
  active: 'success',
  invited: 'warning',
  inactive: 'default',
} as const;

const Organization: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [teams, setTeams] = useState(mockTeams);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#1976d2',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer',
    teamId: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateTeam = () => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      memberCount: 0,
      workflowCount: 0,
      color: formData.color,
      members: [],
    };
    setTeams(prev => [...prev, newTeam]);
    setDialogOpen(false);
    setFormData({ name: '', description: '', color: '#1976d2' });
  };

  const handleInviteMember = () => {
    console.log('Inviting member:', inviteData);
    // TODO: Implement member invitation logic
    setInviteDialogOpen(false);
    setInviteData({ email: '', role: 'viewer', teamId: '' });
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(team => team.id !== teamId));
  };

  const TabPanel = ({ children, value, index }: { children: React.ReactNode; value: number; index: number }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Organization
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Email />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite Member
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
          >
            Create Team
          </Button>
        </Stack>
      </Box>

      {/* Organization Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Members
                  </Typography>
                  <Typography variant="h4">
                    {mockOrgStats.totalMembers}
                  </Typography>
                </Box>
                <People color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Workflows
                  </Typography>
                  <Typography variant="h4">
                    {mockOrgStats.activeWorkflows}
                  </Typography>
                </Box>
                <Analytics color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Monthly Executions
                  </Typography>
                  <Typography variant="h4">
                    {mockOrgStats.monthlyExecutions.toLocaleString()}
                  </Typography>
                </Box>
                <Security color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Storage Used
                  </Typography>
                  <Typography variant="h4">
                    {mockOrgStats.storageUsed}
                  </Typography>
                </Box>
                <Business color="warning" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Teams" />
          <Tab label="Members" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Teams Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {teams.map((team) => (
            <Grid item xs={12} md={6} lg={4} key={team.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          backgroundColor: team.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <Group sx={{ color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {team.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {team.memberCount} members • {team.workflowCount} workflows
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={() => handleDeleteTeam(team.id)}>
                      <Delete />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {team.description}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1}>
                      {team.members.slice(0, 3).map((member) => (
                        <Avatar
                          key={member.id}
                          sx={{ width: 24, height: 24 }}
                          src={member.avatar}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                      ))}
                      {team.members.length > 3 && (
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          +{team.members.length - 3}
                        </Avatar>
                      )}
                    </Stack>
                    <Button size="small" variant="outlined">
                      Manage
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Members Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Members
            </Typography>
            <List>
              {teams.flatMap(team => team.members).map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={member.avatar}>
                        {member.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" component="span">
                            {member.email}
                          </Typography>
                          <Box mt={0.5}>
                            <Chip
                              label={member.role}
                              size="small"
                              color={roleColors[member.role]}
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={member.status}
                              size="small"
                              color={statusColors[member.status]}
                            />
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < teams.flatMap(team => team.members).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Organization Settings
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Organization Name"
                    defaultValue="Acme Corporation"
                    fullWidth
                  />
                  <TextField
                    label="Website"
                    defaultValue="https://acme.com"
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    multiline
                    rows={3}
                    defaultValue="A leading company in workflow automation"
                    fullWidth
                  />
                  <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>
                    Save Changes
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Two-Factor Authentication
                    </Typography>
                    <Button variant="outlined" size="small">
                      Configure 2FA
                    </Button>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Single Sign-On (SSO)
                    </Typography>
                    <Button variant="outlined" size="small">
                      Setup SSO
                    </Button>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      API Keys
                    </Typography>
                    <Button variant="outlined" size="small">
                      Manage API Keys
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Team Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Team Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTeam}
            variant="contained"
            disabled={!formData.name}
          >
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Member Dialog */}  
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteData.role}
                onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as any }))}
                label="Role"
              >
                <MenuItem value="viewer">Viewer</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Team</InputLabel>
              <Select
                value={inviteData.teamId}
                onChange={(e) => setInviteData(prev => ({ ...prev, teamId: e.target.value }))}
                label="Team"
              >
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleInviteMember}
            variant="contained"
            disabled={!inviteData.email || !inviteData.teamId}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organization;
