'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Container,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  ShoppingCart,
  People,
  Category,
  Inventory,
  Analytics,
  Settings,
  Notifications,
  Logout,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const drawerWidth = 260;

const menuItems = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/admin', exact: true },
  { text: 'Commandes', icon: <ShoppingCart />, path: '/admin/orders' },
  { text: 'Utilisateurs', icon: <People />, path: '/admin/users' },
  { text: 'Produits', icon: <Inventory />, path: '/admin/products' },
  { text: 'Catégories', icon: <Category />, path: '/admin/categories' },
  { text: 'Analytics', icon: <Analytics />, path: '/admin/analytics' },
  { text: 'Rapports', icon: <Analytics />, path: '/admin/reports' },
  { text: 'Paramètres', icon: <Settings />, path: '/admin/settings' }
];

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Vérification d'authentification et de rôle
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!hasRole('admin')) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, hasRole, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const drawer = (
    <Box>
      {/* En-tête du drawer */}
      <Toolbar 
        sx={{ 
          backgroundColor: 'primary.main',
          color: 'white',
          flexDirection: 'column',
          alignItems: 'flex-start',
          py: 3
        }}
      >
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            mb: 1
          }}
        >
          BuySell Admin
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Panel d'administration
        </Typography>
      </Toolbar>

      <Divider />

      {/* Menu de navigation */}
      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.path
            : pathname.startsWith(item.path);
          
          return (
            <Link 
              key={item.text} 
              href={item.path}
              style={{ textDecoration: 'none' }}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.main' : 'action.hover',
                  }
                }}
              >
                <Box 
                  sx={{ 
                    mr: 2,
                    opacity: isActive ? 1 : 0.7
                  }}
                >
                  {item.icon}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem'
                  }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </List>
    </Box>
  );

  if (!isAuthenticated() || !hasRole('admin')) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          Redirection vers la page d'accueil...
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'primary.main'
            }}
          >
            {menuItems.find(item => 
              item.exact ? pathname === item.path : pathname.startsWith(item.path)
            )?.text || 'Administration'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton 
              onClick={handleProfileMenuOpen}
              sx={{ p: 0, ml: 1 }}
            >
              <Avatar 
                alt={user?.firstName || 'Admin'} 
                src={user?.avatar}
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem'
                }}
              >
                {(user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || '')}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'grey.50'
        }}
      >
        <Toolbar /> {/* Espace pour l'AppBar */}
        {children}
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              fontSize: '0.875rem'
            }
          }
        }}
      >
        <MenuItem onClick={() => router.push('/profile')}>
          <Person sx={{ mr: 1, fontSize: 20 }} />
          Mon profil
        </MenuItem>
        <MenuItem onClick={() => router.push('/')}>
          <Dashboard sx={{ mr: 1, fontSize: 20 }} />
          Site public
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1, fontSize: 20 }} />
          Déconnexion
        </MenuItem>
      </Menu>
    </Box>
  );
}
