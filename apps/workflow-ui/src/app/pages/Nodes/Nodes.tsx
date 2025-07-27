import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search,
  Api,
  Storage,
  Email,
  Schedule,
  Code,
  Transform,
  Webhook,
  CloudUpload,
  Notifications,
} from '@mui/icons-material';

interface Node {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  version: string;
  isPopular?: boolean;
}

const mockNodes: Node[] = [
  {
    id: 'http-request',
    name: 'HTTP Request',
    description: 'Make HTTP requests to any URL',
    category: 'Core',
    icon: <Api />,
    color: '#ff6b6b',
    version: '1.0.0',
    isPopular: true,
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Listen for incoming webhooks',
    category: 'Trigger',
    icon: <Webhook />,
    color: '#4ecdc4',
    version: '1.2.0',
    isPopular: true,
  },
  {
    id: 'database',
    name: 'MySQL',
    description: 'Connect and query MySQL databases',
    category: 'Database',
    icon: <Storage />,
    color: '#45b7d1',
    version: '2.1.0',
  },
  {
    id: 'email',
    name: 'Send Email',
    description: 'Send emails via SMTP',
    category: 'Communication',
    icon: <Email />,
    color: '#f39c12',
    version: '1.5.0',
    isPopular: true,
  },
  {
    id: 'scheduler',
    name: 'Cron',
    description: 'Schedule workflows to run at specific times',
    category: 'Trigger',
    icon: <Schedule />,
    color: '#9b59b6',
    version: '1.0.0',
  },
  {
    id: 'javascript',
    name: 'Code',
    description: 'Execute custom JavaScript code',
    category: 'Core',
    icon: <Code />,
    color: '#2c3e50',
    version: '1.3.0',
    isPopular: true,
  },
  {
    id: 'transform',
    name: 'Data Transform',
    description: 'Transform and manipulate data',
    category: 'Transform',
    icon: <Transform />,
    color: '#e74c3c',
    version: '1.1.0',
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Upload files to cloud storage',
    category: 'File',
    icon: <CloudUpload />,
    color: '#27ae60',
    version: '1.0.0',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages to Slack channels',
    category: 'Communication',
    icon: <Notifications />,
    color: '#4a154b',
    version: '2.0.0',
    isPopular: true,
  },
];

const categories = ['All', 'Core', 'Trigger', 'Database', 'Communication', 'Transform', 'File'];

const Nodes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredNodes = mockNodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedNode(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Nodes
        </Typography>
        <Button variant="outlined" color="primary">
          Create Custom Node
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {filteredNodes.map((node) => (
          <Grid item xs={12} sm={6} md={4} key={node.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                position: 'relative',
              }}
              onClick={() => handleNodeClick(node)}
            >
              {node.isPopular && (
                <Chip
                  label="Popular"
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                />
              )}
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      backgroundColor: node.color,
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {node.icon}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" component="h3">
                      {node.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      v{node.version}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {node.description}
                </Typography>
                <Chip
                  label={node.category}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredNodes.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No nodes found matching your search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or category filter
          </Typography>
        </Box>
      )}

      {/* Node Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedNode && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    backgroundColor: selectedNode.color,
                    mr: 2,
                    width: 56,
                    height: 56,
                  }}
                >
                  {selectedNode.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedNode.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Version {selectedNode.version} • {selectedNode.category}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedNode.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Features
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This node provides comprehensive functionality for {selectedNode.name.toLowerCase()} 
                operations within your workflows. It supports various configuration options and 
                integrates seamlessly with other nodes.
              </Typography>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure authentication, parameters, and output settings through the 
                node properties panel when added to a workflow.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button variant="contained" onClick={handleCloseDialog}>
                Add to Workflow
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Nodes;
