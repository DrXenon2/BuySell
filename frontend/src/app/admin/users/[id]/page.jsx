'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Email,
  Phone,
  CalendarToday,
  ShoppingCart
} from '@mui/icons-material';
import Link from 'next/link';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`user-tabpanel-${index}`}
    aria-labelledby={`user-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id;
  const [activeTab, setActiveTab] = React.useState(0);
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulation de chargement des données utilisateur
    const loadUserData = async () => {
      try {
        // En production, vous feriez un appel API ici
        setTimeout(() => {
          setUser({
            id: userId,
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@example.com',
            phone: '+33123456789',
            role: 'customer',
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-03-20T14:25:00Z',
            ordersCount: 12,
            totalSpent: 2450.50,
            addresses: [
              {
                id: 1,
                street: '123 Avenue des Champs-Élysées',
                city: 'Paris',
                postalCode: '75008',
                country: 'France',
                isDefault: true
              }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Chargement...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Utilisateur non trouvé
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            component={Link}
            href="/admin/users"
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Retour
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {user.firstName} {user.lastName}
          </Typography>
          <Button
            component={Link}
            href={`/admin/users/${userId}/edit`}
            startIcon={<Edit />}
            variant="contained"
          >
            Modifier
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip 
            label={user.role} 
            color={user.role === 'admin' ? 'primary' : 'default'}
            variant="outlined"
          />
          <Chip 
            label={user.status} 
            color={user.status === 'active' ? 'success' : 'error'}
          />
          <Typography variant="body2" color="text.secondary">
            Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informations principales */}
        <Grid item xs={12} md={4}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Informations de contact
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Email color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                {user.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Téléphone
                      </Typography>
                      <Typography variant="body1">
                        {user.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday color="action" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Dernière connexion
                    </Typography>
                    <Typography variant="body1">
                      {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="admin-card" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Statistiques
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Commandes
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {user.ordersCount}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total dépensé
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {user.totalSpent.toLocaleString()} €
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Panier moyen
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {((user.totalSpent / user.ordersCount) || 0).toLocaleString()} €
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contenu principal */}
        <Grid item xs={12} md={8}>
          <Card className="admin-card">
            <CardContent sx={{ p: 0 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
              >
                <Tab label="Commandes" />
                <Tab label="Adresses" />
                <Tab label="Activité" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Historique des commandes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Intégration avec le système de commandes à prévoir
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Adresses enregistrées
                  </Typography>
                  
                  {user.addresses.map((address, index) => (
                    <Box key={address.id} sx={{ mb: 3, pb: 2, borderBottom: index < user.addresses.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" fontWeight="500">
                          {address.street}
                        </Typography>
                        {address.isDefault && (
                          <Chip label="Par défaut" size="small" color="primary" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {address.postalCode} {address.city}, {address.country}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Journal d'activité
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Historique des activités de l'utilisateur à prévoir
                  </Typography>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
