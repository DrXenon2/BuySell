import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';

export default function ForgotPasswordLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c5530 0%, #4a7c59 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        position: 'relative'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Header Link */}
      <Box
        sx={{
          position: 'absolute',
          top: 24,
          left: 24
        }}
      >
        <Link 
          href="/" 
          style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2c5530',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            BS
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #ffffff, #e5e7eb)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            BuySell
          </Typography>
        </Link>
      </Box>

      <Container 
        maxWidth="sm" 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {children}
      </Container>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}
      >
        <Typography variant="caption" sx={{ color: 'white', opacity: 0.8 }}>
          © 2025 BuySell Platform. Tous droits réservés.
        </Typography>
      </Box>
    </Box>
  );
}
