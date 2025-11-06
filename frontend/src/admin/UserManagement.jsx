import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
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
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';

const UserRow = ({ user, onEdit, onStatusChange, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onStatusChange(user.id, newStatus);
      handleMenuClose();
    } catch (error) {
      console.error('Erreur changement statut:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(user.id);
      setDeleteDialog(false);
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'primary';
      case 'seller': return 'secondary';
      case 'customer': return 'default';
      default: return 'default';
    }
  };

  return (
    <>
      <tr>
        <td>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="500">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
        </td>
        <td>
          <Chip 
            label={user.role} 
            size="small" 
            color={getRoleColor(user.role)}
            variant="outlined"
          />
        </td>
        <td>
          <Chip 
            label={user.status} 
            size="small" 
            color={getStatusColor(user.status)}
          />
        </td>
        <td>
          <Typography variant="body2">
            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
          </Typography>
        </td>
        <td>
          <Box className="admin-action-buttons">
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
        <MenuItem onClick={() => onEdit(user)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        
        {user.status === 'active' ? (
          <MenuItem onClick={() => handleStatusChange('inactive')}>
            <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
            Désactiver
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleStatusChange('active')}>
            <ActivateIcon sx={{ mr: 1, fontSize: 20 }} />
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
            Êtes-vous sûr de vouloir supprimer l'utilisateur {user.firstName} {user.lastName} ?
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
    </>
  );
};

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, [page, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        page,
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      
      setUsers(response.users);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      await loadUsers(); // Recharger la liste
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      await loadUsers(); // Recharger la liste
    } catch (error) {
      throw error;
    }
  };

  const handleEdit = (user) => {
    // Navigation vers la page d'édition
    console.log('Édition utilisateur:', user);
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;

    return true;
  });

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Gestion des utilisateurs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez les utilisateurs, leurs rôles et leurs statuts
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Barre de recherche et filtres */}
      <Box className="admin-search-bar" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            sx={{ minWidth: 300 }}
            size="small"
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rôle</InputLabel>
            <Select
              value={roleFilter}
              label="Rôle"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="all">Tous les rôles</MenuItem>
              <MenuItem value="customer">Client</MenuItem>
              <MenuItem value="seller">Vendeur</MenuItem>
              <MenuItem value="admin">Administrateur</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              label="Statut"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="active">Actif</MenuItem>
              <MenuItem value="inactive">Inactif</MenuItem>
              <MenuItem value="suspended">Suspendu</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={loadUsers}
          >
            Filtrer
          </Button>
        </Box>
      </Box>

      {/* Tableau des utilisateurs */}
      <Box className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan="5">
                    <Box className="admin-skeleton" sx={{ height: 60 }} />
                  </td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                  <Typography color="text.secondary">
                    Aucun utilisateur trouvé
                  </Typography>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={handleEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
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
            Page {page} sur {totalPages}
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
