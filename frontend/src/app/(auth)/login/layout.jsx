import React from 'react';
import { Box, Container } from '@mui/material';
import { AuthProvider } from '../../contexts/AuthContext';

export default function AuthLayout({ children }) {
  return (
    <AuthProvider>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #2c5530 0%, #4a7c59 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Container 
          maxWidth="sm" 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {children}
        </Container>
      </Box>
    </AuthProvider>
  );
}
