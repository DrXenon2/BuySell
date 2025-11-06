import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  People,
  AttachMoney,
  Inventory
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, change, icon, loading = false }) => (
  <Card className="admin-card">
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

const RecentActivity = ({ activities, loading }) => (
  <Card className="admin-card">
    <CardContent>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        Activité récente
      </Typography>
      
      {loading ? (
        <Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box className="admin-skeleton" sx={{ height: 16, width: '80%', mb: 1 }} />
              <Box className="admin-skeleton" sx={{ height: 12, width: '60%' }} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box>
          {activities.map((activity, index) => (
            <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < activities.length - 1 ? 1 : 0, borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {activity.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activity.time}
              </Typography>
            </Box>
          ))}
        </Box>
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
    productsChange: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardData, activitiesData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivities()
      ]);

      setStats(dashboardData);
      setRecentActivities(activitiesData);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bonjour {user?.firstName}, voici l'aperçu de votre plateforme
        </Typography>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Chiffre d'affaires"
            value={`${stats.totalRevenue.toLocaleString()} €`}
            change={stats.revenueChange}
            icon={<AttachMoney />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Commandes"
            value={stats.totalOrders.toLocaleString()}
            change={stats.ordersChange}
            icon={<ShoppingCart />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers.toLocaleString()}
            change={stats.usersChange}
            icon={<People />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Produits"
            value={stats.totalProducts.toLocaleString()}
            change={stats.productsChange}
            icon={<Inventory />}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Contenu principal */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          {/* Graphiques et données principales */}
          <Card className="admin-card">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Performance des ventes
              </Typography>
              
              {loading ? (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LinearProgress sx={{ width: '100%' }} />
                </Box>
              ) : (
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <Typography>
                    Graphique des performances à intégrer
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <RecentActivity 
            activities={recentActivities} 
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Alertes et notifications */}
      <Card className="admin-card" sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Alertes système
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2">
              ⚠️ 3 produits sont en rupture de stock
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
