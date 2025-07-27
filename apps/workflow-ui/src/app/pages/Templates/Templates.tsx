import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Stack,
  Rating,
} from '@mui/material';
import {
  Search,
  Email,
  Storage,
  Api,
  Schedule,
  CloudUpload,
  ShoppingCart,
  Analytics,
  Notifications,
} from '@mui/icons-material';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  color: string;
  rating: number;
  downloads: number;
  author: string;
  tags: string[];
  isPopular?: boolean;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Welcome Email Series',
    description: 'Automated welcome email sequence for new customers',
    category: 'Marketing',
    icon: <Email />,
    color: '#f39c12',
    rating: 4.8,
    downloads: 1250,
    author: 'FlowForge Team',
    tags: ['Email', 'Marketing', 'Automation'],
    isPopular: true,
  },
  {
    id: '2',
    name: 'Database Backup',
    description: 'Automated daily database backup with cloud storage',
    category: 'DevOps',
    icon: <Storage />,
    color: '#45b7d1',
    rating: 4.6,
    downloads: 890,
    author: 'DevOps Pro',
    tags: ['Database', 'Backup', 'Cloud'],
  },
  {
    id: '3',
    name: 'API Monitor',
    description: 'Monitor API endpoints and send alerts on failures',
    category: 'Monitoring',
    icon: <Api />,
    color: '#e74c3c',
    rating: 4.5,
    downloads: 670,
    author: 'Monitor Master',
    tags: ['API', 'Monitoring', 'Alerts'],
  },
  {
    id: '4',
    name: 'Social Media Scheduler',
    description: 'Schedule and post content across multiple platforms',
    category: 'Marketing',
    icon: <Schedule />,
    color: '#9b59b6',
    rating: 4.7,
    downloads: 1100,
    author: 'Social Expert',
    tags: ['Social Media', 'Scheduling', 'Content'],
    isPopular: true,
  },
  {
    id: '5',
    name: 'File Processing Pipeline',
    description: 'Process uploaded files and extract metadata',
    category: 'Data Processing',
    icon: <CloudUpload />,
    color: '#27ae60',
    rating: 4.4,
    downloads: 540,
    author: 'Data Engineer',
    tags: ['Files', 'Processing', 'Metadata'],
  },
  {
    id: '6',
    name: 'E-commerce Order Flow',
    description: 'Complete order processing workflow for online stores',
    category: 'E-commerce',
    icon: <ShoppingCart />,
    color: '#ff6b6b',
    rating: 4.9,
    downloads: 1400,
    author: 'Commerce Pro',
    tags: ['E-commerce', 'Orders', 'Payment'],
    isPopular: true,
  },
];

const categories = ['All', 'Marketing', 'DevOps', 'Monitoring', 'Data Processing', 'E-commerce'];

const Templates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (templateId: string) => {
    console.log('Using template:', templateId);
    // TODO: Navigate to workflow editor with template
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Templates
        </Typography>
        <Button variant="outlined" color="primary">
          Submit Template
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search templates..."
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
        {filteredTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
            >
              {template.isPopular && (
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
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      backgroundColor: template.color,
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {template.icon}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" component="h3">
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {template.author}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {template.description}
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <Rating value={template.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary" ml={1}>
                    ({template.rating}) • {template.downloads} downloads
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {template.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  Preview
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredTemplates.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or category filter
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Templates;
