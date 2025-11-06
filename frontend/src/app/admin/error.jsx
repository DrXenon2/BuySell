'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { Refresh, Home } from '@mui/icons-material';
import Link from 'next/link';

export default function AdminError({ error, reset }) {
  return (
    <Container maxWidth="md">
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
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
              mx: 'auto',
              mb: 3
            }}
          >
            <Typography variant="h2" component="span" fontWeight="bold">
              !
            </Typography>
          </Box>

          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Erreur Administrateur
          </Typography>

          <Alert severity="error" sx={{ mb: 3, justifyContent: 'center' }}>
            {error?.message || 'Une erreur est survenue dans le panel d\'administration'}
          </Alert>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Si le problème persiste, contactez l'équipe technique.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
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
              href="/admin"
              variant="outlined"
              size="large"
            >
              Tableau de bord
            </Button>
            <Button
              component={Link}
              href="/"
              variant="text"
              startIcon={<Home />}
              size="large"
            >
              Accueil public
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
              <Typography variant="caption" fontFamily="monospace" component="pre">
                {error?.stack}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
