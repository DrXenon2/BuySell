'use client';

import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { 
  ShoppingBag, 
  LocalShipping, 
  Security, 
  TrendingUp,
  ArrowForward
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const FeatureCard = ({ icon, title, description }) => (
  <Card 
    sx={{ 
      height: '100%',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      }
    }}
  >
    <CardContent sx={{ textAlign: 'center', p: 4 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'white',
          mb: 3
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <ShoppingBag sx={{ fontSize: 40 }} />,
      title: 'Achat Sécurisé',
      description: 'Transactions sécurisées avec protection acheteur et système de confiance vérifié.'
    },
    {
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      title: 'Livraison Rapide',
      description: 'Livraison express disponible avec suivi en temps réel et options de retrait.'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Paiements Protégés',
      description: 'Paiements cryptés avec multiples options et protection contre la fraude.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Vendez Facilement',
      description: 'Outil de vente intuitif avec gestion d\'inventaire et analytics avancés.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2c5530 0%, #4a7c59 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: 2
                }}
              >
                La marketplace{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(45deg, #ffd700, #ffed4e)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  moderne
                </Box>{' '}
                pour tous
              </Typography>
              <Typography
                variant="h5"
                component="p"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Découvrez, achetez et vendez en toute confiance sur notre plateforme sécurisée. 
                Rejoignez des milliers de membres satisfaits.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {user ? (
                  <>
                    <Button
                      component={Link}
                      href="/products"
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Explorer les produits
                    </Button>
                    {user.role === 'seller' && (
                      <Button
                        component={Link}
                        href="/dashboard/seller"
                        variant="outlined"
                        size="large"
                        sx={{
                          borderColor: 'white',
                          color: 'white',
                          '&:hover': {
                            borderColor: 'grey.300',
                            bgcolor: 'rgba(255,255,255,0.1)'
                          }
                        }}
                      >
                        Tableau de bord
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      component={Link}
                      href="/auth/register"
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Commencer gratuitement
                    </Button>
                    <Button
                      component={Link}
                      href="/products"
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'grey.300',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Voir les produits
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  textAlign: 'center'
                }}
              >
                <Box
                  component="img"
                  src="/images/hero-illustration.svg"
                  alt="BuySell Platform"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))'
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            Pourquoi choisir BuySell ?
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Une expérience d'achat et de vente optimisée avec toutes les fonctionnalités 
            dont vous avez besoin pour réussir.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard {...feature} />
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'grey.50',
          py: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            Prêt à commencer ?
          </Typography>
          <Typography
            variant="h6"
            component="p"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
          >
            Rejoignez notre communauté grandissante et découvrez une nouvelle façon 
            d'acheter et de vendre en ligne.
          </Typography>
          <Button
            component={Link}
            href={user ? '/products' : '/auth/register'}
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            {user ? 'Explorer maintenant' : 'Créer un compte gratuit'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
