import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 3
      }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{
          color: 'primary.main'
        }}
      />
      <Typography variant="h6" color="text.secondary">
        Chargement...
      </Typography>
    </Box>
  );
}
