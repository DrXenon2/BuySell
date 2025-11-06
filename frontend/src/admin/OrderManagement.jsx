import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Pagination,
  Button,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';

const OrderRow = ({ order, onView, onStatusUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusUpdate = async () => {
    try {
      await onStatusUpdate(order.id, selectedStatus);
      setStatusDialog(false);
      handleMenuClose();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'default';
      default: return 'default';
    }
  };

  return (
    <>
      <tr>
        <td>
          <Typography variant="body2" fontWeight="500">
            {order.orderNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </Typography>
        </td>
        <td>
          <Typography variant="body2">
            {order.user?.firstName} {order.user?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {order.user?.email}
          </Typography>
        </td>
        <td>
          <Typography variant="body2" fontWeight="500">
            {order.totalAmount.toLocaleString()} €
          </Typography>
        </td>
        <td>
          <Chip 
            label={getStatusLabel(order.status)} 
            size="small" 
            color={getStatusColor(order.status)}
          />
        </td>
        <td>
          <Chip 
            label={order.paymentStatus} 
            size="small" 
            color={getPaymentStatusColor(order.paymentStatus)}
            variant="outlined"
          />
        </td>
        <td>
          <Typography variant="body2">
            {order.items?.length || 0} article(s)
          </Typography>
        </td>
        <td>
          <Box className="admin-action-buttons">
            <IconButton size="small" onClick={() => onView(order)}>
              <ViewIcon />
            </IconButton>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>
        </td>
      </tr>

      {/* Menu actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => onView(order)}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          Voir les détails
        </MenuItem>
        
        <MenuItem onClick={() => setStatusDialog(true)}>
          <ShippingIcon sx={{ mr: 1, fontSize: 20 }} />
          Modifier le statut
        </MenuItem>
        
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <MenuItem onClick={() => onStatusUpdate(order.id, 'cancelled')}>
            <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
            Annuler la commande
          </MenuItem>
        )}
      </Menu>

      {/* Dialog modification statut */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Modifier le statut de la commande
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nouveau statut</InputLabel>
            <Select
              value={selectedStatus}
              label="Nouveau statut"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="confirmed">Confirmée</MenuItem>
              <MenuItem value="processing">En traitement</MenuItem>
              <MenuItem value="shipped">Expédiée</MenuItem>
              <MenuItem value="delivered">Livrée</MenuItem>
              <MenuItem value="cancelled">Annulée</MenuItem>
              <MenuItem value="refunded">Remboursée</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>
            Annuler
          </Button>
          <Button onClick={handleStatusUpdate} variant="contained">
            Mettre à jour
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await adminService.getOrders({
        page,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      setOrders(response.orders);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      await loadOrders(); // Recharger la liste
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      throw error;
    }
  };

  const handleView = (order) => {
    navigate(`/admin/orders/${order.id}`);
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Gestion des commandes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Suivez et gérez toutes les commandes de votre plateforme
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Box className="admin-search-bar" sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="confirmed">Confirmée</MenuItem>
              <MenuItem value="processing">En traitement</MenuItem>
              <MenuItem value="shipped">Expédiée</MenuItem>
              <MenuItem value="delivered">Livrée</MenuItem>
              <MenuItem value="cancelled">Annulée</MenuItem>
              <MenuItem value="refunded">Remboursée</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={loadOrders}
          >
            Actualiser
          </Button>
        </Box>
      </Box>

      {/* Tableau des commandes */}
      <Box className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Paiement</th>
              <th>Articles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan="7">
                    <Box className="admin-skeleton" sx={{ height: 60 }} />
                  </td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <Typography color="text.secondary">
                    Aucune commande trouvée
                  </Typography>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  onView={handleView}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </tbody>
        </table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box className="admin-pagination">
          <Typography variant="body2" color="text.secondary">
            Page {page} sur {totalPages} - {orders.length} commandes
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
