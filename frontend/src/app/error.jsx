'use client';

import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Refresh, Home } from '@mui/icons-material';
import Link from 'next/link';

export default function Error({ error, reset }) {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: 'error.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'error.main',
            mb: 2
          }}
        >
          <Typography variant="h2" component="span" fontWeight="bold">
            !
          </Typography>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Oups ! Une erreur est survenue
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {error?.message || 'Quelque chose s\'est mal passé. Veuillez réessayer.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={reset}
            size="large"
          >
            Réessayer
          </Button>
          <Button
            component={Link}
            href="/"
            variant="outlined"
            startIcon={<Home />}
            size="large"
          >
            Retour à l'accueil
          </Button>
        </Box>

        {process.env.NODE_ENV === 'development' && (
          <Box
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'grey.100',
              borderRadius: 2,
              textAlign: 'left',
              maxWidth: '100%',
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" fontFamily="monospace" component="pre">
              {error?.stack}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}
