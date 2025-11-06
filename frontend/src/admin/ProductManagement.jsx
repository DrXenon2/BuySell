import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Card,
  CardMedia,
  Rating
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';

const ProductCard = ({ product, onEdit, onDelete, onStatusChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    navigate(`/products/${product.id}`);
    handleMenuClose();
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onStatusChange(product.id, newStatus);
      handleMenuClose();
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(product.id);
      setDeleteDialog(false);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <Card className="admin-card" sx={{ height: '100%' }}>
      <CardMedia
        component="img"
        height="200"
        image={product.images?.[0] || '/images/placeholder-product.jpg'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
            {product.name}
          </Typography>
          
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreIcon />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {product.category?.name || 'Non catégorisé'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={product.rating || 0} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviewCount || 0})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
            {product.price.toLocaleString()} €
          </Typography>
          <Chip 
            label={product.stockQuantity > 0 ? 'En stock' : 'Rupture'} 
            size="small"
            color={product.stockQuantity > 0 ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip 
            label={product.isActive ? 'Actif' : 'Inactif'} 
            size="small"
            color={product.isActive ? 'success' : 'default'}
            variant="outlined"
          />
          {product.isFeatured && (
            <Chip label="En vedette" size="small" color="secondary" variant="outlined" />
          )}
          {product.isOnSale && (
            <Chip label="En solde" size="small" color="warning" variant="outlined" />
          )}
        </Box>
      </Box>

      {/* Menu actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          Voir
        </MenuItem>
        <MenuItem onClick={() => onEdit(product)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        
        {product.isActive ? (
          <MenuItem onClick={() => handleStatusChange(false)}>
            <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
            Désactiver
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleStatusChange(true)}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            Activer
          </MenuItem>
        )}
        
        <MenuItem onClick={() => setDeleteDialog(true)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Dialog confirmation suppression */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le produit "{product.name}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getProducts({
        page,
        limit: 12
      });
      
      setProducts(response.products);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, isActive) => {
    try {
      await adminService.updateProductStatus(productId, isActive);
      await loadProducts();
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await adminService.deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/products/create');
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Gestion des produits
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez le catalogue de produits de votre plateforme
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          size="large"
        >
          Nouveau produit
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grille de produits */}
      {loading ? (
        <Box className="admin-stats-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="admin-card">
              <Box className="admin-skeleton" sx={{ height: 200, mb: 2 }} />
              <Box sx={{ p: 2 }}>
                <Box className="admin-skeleton" sx={{ height: 24, width: '80%', mb: 1 }} />
                <Box className="admin-skeleton" sx={{ height: 16, width: '60%', mb: 2 }} />
                <Box className="admin-skeleton" sx={{ height: 20, width: '40%' }} />
              </Box>
            </Card>
          ))}
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun produit trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Commencez par ajouter votre premier produit à la plateforme
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Créer un produit
          </Button>
        </Box>
      ) : (
        <>
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 3,
              mb: 4
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box className="admin-pagination">
              <Typography variant="body2" color="text.secondary">
                Page {page} sur {totalPages} - {products.length} produits
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
