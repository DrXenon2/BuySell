import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  AttachMoney,
  Inventory,
  Category,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  CalendarToday,
  LocalShipping
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, change, icon, loading = false, onClick }) => (
  <Card 
    className="admin-card" 
    sx={{ cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <CardContent>
      <Box className="admin-card-header">
        <Typography className="admin-card-title">
          {title}
        </Typography>
        <Box sx={{ color: 'primary.main' }}>
          {icon}
        </Box>
      </Box>
      
      {loading ? (
        <Box>
          <Box className="admin-skeleton" sx={{ height: 32, mb: 1 }} />
          <Box className="admin-skeleton" sx={{ height: 16, width: '60%' }} />
        </Box>
      ) : (
        <>
          <Typography className="admin-card-value">
            {value}
          </Typography>
          <Box className={`admin-card-change ${change >= 0 ? 'change-positive' : 'change-negative'}`}>
            {change >= 0 ? <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} /> : <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />}
            {Math.abs(change)}% vs mois dernier
          </Box>
        </>
      )}
    </CardContent>
  </Card>
);

const QuickStats = ({ stats, loading }) => (
  <Card className="admin-card">
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarToday fontSize="small" />
        Aujourd'hui
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary.main" fontWeight="700">
              {loading ? '-' : stats.todayOrders}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nouvelles commandes
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" fontWeight="700">
              {loading ? '-' : `€${stats.todayRevenue}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chiffre d'affaires
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="info.main" fontWeight="700">
              {loading ? '-' : stats.todayUsers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nouveaux utilisateurs
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main" fontWeight="700">
              {loading ? '-' : stats.lowStockProducts}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Produits stock bas
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const SystemAlerts = ({ alerts, loading }) => (
  <Card className="admin-card">
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Alertes système
      </Typography>
      
      {loading ? (
        <Box>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box className="admin-skeleton" sx={{ height: 16, width: '80%', mb: 0.5 }} />
              <Box className="admin-skeleton" sx={{ height: 12, width: '60%' }} />
            </Box>
          ))}
        </Box>
      ) : alerts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Aucune alerte système
          </Typography>
        </Box>
      ) : (
        <List dense>
          {alerts.map((alert, index) => (
            <ListItem key={index} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {alert.severity === 'high' ? (
                  <ErrorIcon sx={{ color: 'error.main' }} />
                ) : alert.severity === 'medium' ? (
                  <Warning sx={{ color: 'warning.main' }} />
                ) : (
                  <CheckCircle sx={{ color: 'success.main' }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={alert.message}
                secondary={alert.date}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

const RecentOrders = ({ orders, loading, onViewOrder }) => (
  <Card className="admin-card">
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Commandes récentes
        </Typography>
        <Button size="small" onClick={onViewOrder}>
          Voir tout
        </Button>
      </Box>
      
      {loading ? (
        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box className="admin-skeleton" sx={{ height: 16, width: '80%', mb: 0.5 }} />
              <Box className="admin-skeleton" sx={{ height: 12, width: '60%' }} />
            </Box>
          ))}
        </Box>
      ) : (
        <List dense>
          {orders.map((order, index) => (
            <React.Fragment key={order.id}>
              <ListItem 
                sx={{ px: 0, cursor: 'pointer' }}
                onClick={() => onViewOrder(order)}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <LocalShipping fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={`${order.orderNumber} - ${order.customerName}`}
                  secondary={`${order.totalAmount}€ • ${order.status}`}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </Typography>
              </ListItem>
              {index < orders.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
    usersChange: 0,
    productsChange: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayUsers: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardData, ordersData, alertsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders({ limit: 5 }),
        adminService.getSystemAlerts()
      ]);

      setStats(dashboardData);
      setRecentOrders(ordersData.orders || []);
      setSystemAlerts(alertsData);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrders = () => {
    navigate('/admin/orders');
  };

  const handleViewOrder = (order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const handleStatClick = (type) => {
    switch (type) {
      case 'revenue':
        navigate('/admin/analytics');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'products':
        navigate('/admin/products');
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 2 }}
        action={
          <Button color="inherit" size="small" onClick={loadDashboardData}>
            <Refresh sx={{ mr: 0.5 }} />
            Réessayer
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête avec bouton actualiser */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Tableau de bord
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bonjour {user?.firstName}, voici l'aperçu de votre plateforme
          </Typography>
        </Box>
        
        <Button
          startIcon={<Refresh />}
          onClick={loadDashboardData}
          disabled={loading}
          variant="outlined"
        >
          Actualiser
        </Button>
      </Box>

      {/* Statistiques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats.totalRevenue.toLocaleString()} €`}
            change={stats.revenueChange}
            icon={<AttachMoney />}
            loading={loading}
            onClick={() => handleStatClick('revenue')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Commandes"
            value={stats.totalOrders.toLocaleString()}
            change={stats.ordersChange}
            icon={<ShoppingCart />}
            loading={loading}
            onClick={() => handleStatClick('orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers.toLocaleString()}
            change={stats.usersChange}
            icon={<People />}
            loading={loading}
            onClick={() => handleStatClick('users')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Produits"
            value={stats.totalProducts.toLocaleString()}
            change={stats.productsChange}
            icon={<Inventory />}
            loading={loading}
            onClick={() => handleStatClick('products')}
          />
        </Grid>
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* Statistiques du jour */}
            <Grid item xs={12} md={6}>
              <QuickStats stats={stats} loading={loading} />
            </Grid>
            
            {/* Alertes système */}
            <Grid item xs={12} md={6}>
              <SystemAlerts alerts={systemAlerts} loading={loading} />
            </Grid>

            {/* Graphiques et données principales */}
            <Grid item xs={12}>
              <Card className="admin-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Performance des ventes (30 derniers jours)
                  </Typography>
                  
                  {loading ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LinearProgress sx={{ width: '100%' }} />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      height: 300, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'text.secondary',
                      bgcolor: 'grey.50',
                      borderRadius: 1
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TrendingUp sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
                        <Typography variant="h6" gutterBottom>
                          Graphique des performances
                        </Typography>
                        <Typography variant="body2">
                          Intégration avec Chart.js ou Recharts à prévoir
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <RecentOrders 
                orders={recentOrders} 
                loading={loading}
                onViewOrder={handleViewOrder}
              />
            </Grid>
            
            {/* Carte d'activité rapide */}
            <Grid item xs={12}>
              <Card className="admin-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Actions rapides
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      startIcon={<Inventory />}
                      onClick={() => navigate('/admin/products/create')}
                      fullWidth
                    >
                      Nouveau produit
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<Category />}
                      onClick={() => navigate('/admin/categories')}
                      fullWidth
                    >
                      Gérer les catégories
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<People />}
                      onClick={() => navigate('/admin/users')}
                      fullWidth
                    >
                      Voir les utilisateurs
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
