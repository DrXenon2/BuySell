import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Home, Search } from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
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
            width: 160,
            height: 160,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            mb: 2
          }}
        >
          <Search sx={{ fontSize: 64 }} />
        </Box>

        <Typography variant="h1" component="h1" gutterBottom fontWeight="bold">
          404
        </Typography>

        <Typography variant="h4" component="h2" gutterBottom>
          Page non trouvée
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
          Vérifiez l'URL ou retournez à la page d'accueil.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            component={Link}
            href="/"
            variant="contained"
            startIcon={<Home />}
            size="large"
          >
            Retour à l'accueil
          </Button>
          <Button
            component={Link}
            href="/products"
            variant="outlined"
            size="large"
          >
            Explorer les produits
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
