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
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ArrowBack,
  LocalShipping,
  Print,
  Email
} from '@mui/icons-material';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id;
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulation de chargement des données commande
    const loadOrderData = async () => {
      try {
        // En production, vous feriez un appel API ici
        setTimeout(() => {
          setOrder({
            id: orderId,
            orderNumber: 'BS-2024-001-1001',
            status: 'shipped',
            paymentStatus: 'paid',
            paymentMethod: 'card',
            shippingMethod: 'express',
            totalAmount: 159.98,
            subtotal: 149.98,
            taxAmount: 29.99,
            shippingCost: 4.99,
            discountAmount: 10.00,
            createdAt: '2024-03-15T14:30:00Z',
            updatedAt: '2024-03-16T09:15:00Z',
            trackingNumber: 'TRK123456789',
            estimatedDelivery: '2024-03-20',
            customer: {
              id: '1',
              firstName: 'Jean',
              lastName: 'Dupont',
              email: 'jean.dupont@example.com',
              phone: '+33123456789'
            },
            shippingAddress: {
              firstName: 'Jean',
              lastName: 'Dupont',
              street: '123 Avenue des Champs-Élysées',
              city: 'Paris',
              postalCode: '75008',
              country: 'France'
            },
            billingAddress: {
              firstName: 'Jean',
              lastName: 'Dupont',
              street: '123 Avenue des Champs-Élysées',
              city: 'Paris',
              postalCode: '75008',
              country: 'France'
            },
            items: [
              {
                id: 1,
                productId: 123,
                productName: 'iPhone 14 Pro Max',
                productImage: '/images/iphone14.jpg',
                quantity: 1,
                unitPrice: 799.99,
                totalPrice: 799.99,
                options: {
                  color: 'Silver',
                  storage: '256GB'
                }
              },
              {
                id: 2,
                productId: 124,
                productName: 'AirPods Pro',
                productImage: '/images/airpods-pro.jpg',
                quantity: 1,
                unitPrice: 249.99,
                totalPrice: 249.99
              }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Erreur chargement commande:', error);
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'processing': return 'primary';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };
    return labels[status] || status;
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

  if (!order) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Commande non trouvée
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
            href="/admin/orders"
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Retour
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Commande {order.orderNumber}
          </Typography>
          <Button startIcon={<Print />} variant="outlined">
            Imprimer
          </Button>
          <Button startIcon={<Email />} variant="outlined">
            Email
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip 
            label={getStatusLabel(order.status)} 
            color={getStatusColor(order.status)}
          />
          <Chip 
            label={order.paymentStatus} 
            color={order.paymentStatus === 'paid' ? 'success' : 'warning'}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informations client */}
        <Grid item xs={12} md={4}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Client
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="500">
                  {order.customer.firstName} {order.customer.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customer.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customer.phone}
                </Typography>
              </Box>

              <Button variant="outlined" size="small" fullWidth>
                Voir le profil client
              </Button>
            </CardContent>
          </Card>

          {/* Adresse de livraison */}
          <Card className="admin-card" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Livraison
              </Typography>
              
              <Box>
                <Typography variant="body2" fontWeight="500">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress.street}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shippingAddress.country}
                </Typography>
              </Box>

              {order.trackingNumber && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LocalShipping fontSize="small" />
                    <Typography variant="body2" fontWeight="500">
                      Numéro de suivi
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary.main">
                    {order.trackingNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Livraison estimée: {new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Détails de la commande */}
        <Grid item xs={12} md={8}>
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Articles commandés
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Produit</TableCell>
                      <TableCell align="right">Prix unitaire</TableCell>
                      <TableCell align="center">Quantité</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              component="img"
                              src={item.productImage}
                              alt={item.productName}
                              sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {item.productName}
                              </Typography>
                              {item.options && (
                                <Typography variant="caption" color="text.secondary">
                                  {Object.values(item.options).join(', ')}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {item.unit
