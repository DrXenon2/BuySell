import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  SubdirectoryArrowRight as SubcategoryIcon
} from '@mui/icons-material';
import { adminService } from '../services/adminService';

const CategoryCard = ({ category, onEdit, onDelete, onAddSubcategory }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      await onDelete(category.id);
      setDeleteDialog(false);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  return (
    <>
      <Card className="admin-card">
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <CategoryIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="600">
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.productCount || 0} produits
                </Typography>
              </Box>
            </Box>
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>

          {category.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {category.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={category.isActive ? 'Active' : 'Inactive'} 
              size="small"
              color={category.isActive ? 'success' : 'default'}
              variant="outlined"
            />
            {category.isFeatured && (
              <Chip label="En vedette" size="small" color="secondary" />
            )}
          </Box>

          {/* Sous-catégories */}
          {category.children && category.children.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight="600" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Sous-catégories:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {category.children.map((child) => (
                  <Chip
                    key={child.id}
                    label={child.name}
                    size="small"
                    variant="outlined"
                    icon={<SubcategoryIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Menu actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => onEdit(category)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        
        <MenuItem onClick={() => onAddSubcategory(category)}>
          <AddIcon sx={{ mr: 1, fontSize: 20 }} />
          Ajouter sous-catégorie
        </MenuItem>
        
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
            Êtes-vous sûr de vouloir supprimer la catégorie "{category.name}" ?
            {category.productCount > 0 && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Attention: Cette catégorie contient {category.productCount} produit(s).
                Ils seront déplacés vers "Non catégorisé".
              </Alert>
            )}
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
    </>
  );
};

const CategoryForm = ({ open, onClose, category, parentCategory, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    isFeatured: false,
    parentId: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive !== false,
        isFeatured: category.isFeatured || false,
        parentId: category.parentId || null
      });
    } else if (parentCategory) {
      setFormData(prev => ({
        ...prev,
        parentId: parentCategory.id
      }));
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
        isFeatured: false,
        parentId: null
      });
    }
  }, [category, parentCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {category ? 'Modifier la catégorie' : parentCategory ? 'Nouvelle sous-catégorie' : 'Nouvelle catégorie'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {parentCategory && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Sous-catégorie de: <strong>{parentCategory.name}</strong>
            </Alert>
          )}

          <TextField
            label="Nom de la catégorie"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            margin="normal"
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="normal"
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={formData.isActive}
                  label="Statut"
                  onChange={(e) => handleChange('isActive', e.target.value)}
                >
                  <MenuItem value={true}>Active</MenuItem>
                  <MenuItem value={false}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>En vedette</InputLabel>
                <Select
                  value={formData.isFeatured}
                  label="En vedette"
                  onChange={(e) => handleChange('isFeatured', e.target.value)}
                >
                  <MenuItem value={false}>Non</MenuItem>
                  <MenuItem value={true}>Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Enregistrement...' : (category ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategories({ includeChildren: true });
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setParentCategory(null);
    setFormOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setParentCategory(null);
    setFormOpen(true);
  };

  const handleAddSubcategory = (category) => {
    setEditingCategory(null);
    setParentCategory(category);
    setFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await adminService.deleteCategory(categoryId);
      await loadCategories(); // Recharger la liste
    } catch (error) {
      throw error;
    }
  };

  const handleSubmitCategory = async (formData) => {
    if (editingCategory) {
      await adminService.updateCategory(editingCategory.id, formData);
    } else {
      await adminService.createCategory(formData);
    }
    await loadCategories(); // Recharger la liste
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setParentCategory(null);
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Gestion des catégories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organisez vos produits par catégories et sous-catégories
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCategory}
          size="large"
        >
          Nouvelle catégorie
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grille de catégories */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card className="admin-card">
                <CardContent>
                  <Box className="admin-skeleton" sx={{ height: 48, width: 48, borderRadius: 2, mb: 2 }} />
                  <Box className="admin-skeleton" sx={{ height: 24, width: '80%', mb: 1 }} />
                  <Box className="admin-skeleton" sx={{ height: 16, width: '60%', mb: 2 }} />
                  <Box className="admin-skeleton" sx={{ height: 32, width: '40%' }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune catégorie trouvée
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Commencez par créer votre première catégorie
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCategory}
          >
            Créer une catégorie
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <CategoryCard
                category={category}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onAddSubcategory={handleAddSubcategory}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Formulaire catégorie */}
      <CategoryForm
        open={formOpen}
        onClose={handleCloseForm}
        category={editingCategory}
        parentCategory={parentCategory}
        onSubmit={handleSubmitCategory}
      />
    </Box>
  );
}
