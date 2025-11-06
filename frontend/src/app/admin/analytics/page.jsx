'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Container,
  Grid
} from '@mui/material';

export default function AdminAnalyticsPage() {
  return (
    <Container maxWidth="lg">
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Analysez les performances de votre plateforme
        </Typography>
      </Box>

      {/* Métriques */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" color="primary.main" fontWeight="bold">
                1.2K
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visites aujourd'hui
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                45
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Commandes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" color="info.main" fontWeight="bold">
                €2.4K
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Chiffre d'affaires
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h3" color="warning.main" fontWeight="bold">
                3.2%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux de conversion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Tableaux de bord analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Intégration avec Google Analytics, Mixpanel ou outils BI
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
