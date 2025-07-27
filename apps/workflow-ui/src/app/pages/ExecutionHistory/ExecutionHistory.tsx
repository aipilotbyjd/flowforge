import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const mockExecutions = [
  { id: '1', workflow: 'Email Campaign', status: 'Success', startedAt: '2025-07-24 12:00', duration: '5 mins' },
  { id: '2', workflow: 'Data Backup', status: 'Failed', startedAt: '2025-07-23 14:30', duration: '12 mins' },
  // Add more mock data here as needed
];

const ExecutionHistory: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Execution History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workflow</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Started At</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockExecutions.map((execution) => (
              <TableRow key={execution.id}>
                <TableCell>{execution.workflow}</TableCell>
                <TableCell>{execution.status}</TableCell>
                <TableCell>{execution.startedAt}</TableCell>
                <TableCell>{execution.duration}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExecutionHistory;

