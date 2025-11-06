import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Email as EmailIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { adminService } from '../services/adminService';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const ConfigurationSection = ({ title, children, action }) => (
  <Card className="admin-card" sx={{ mb: 3 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </CardContent>
  </Card>
);

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    // Général
    siteName: 'BuySell Platform',
    siteDescription: 'Marketplace moderne',
    supportEmail: 'support@buysell.com',
    contactEmail: 'contact@buysell.com',
    defaultCurrency: 'EUR',
    timezone: 'Europe/Paris',
    
    // Commerce
    taxRate: 20,
    freeShippingThreshold: 50,
    defaultShippingCost: 4.99,
    commissionRate: 5,
    
    // Paiements
    stripeEnabled: true,
    paypalEnabled: false,
    cashOnDelivery: true,
    
    // Email
    emailNotifications: true,
    orderConfirmation: true,
    shippingUpdates: true,
    marketingEmails: false,
    
    // Sécurité
    requireEmailVerification: true,
    enable2FA: false,
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    
    // Maintenance
    maintenanceMode: false,
    allowRegistrations: true,
    siteLanguage: 'fr'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await adminService.updateSystemSettings(settings);
      setSuccess('Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      setError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const clearCache = async () => {
    try {
      await adminService.clearCache();
      setSuccess('Cache vidé avec succès');
    } catch (error) {
      setError('Erreur lors du vidage du cache');
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Paramètres système
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configurez les paramètres globaux de votre plateforme
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Navigation par onglets */}
      <Card className="admin-card">
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Général" icon={<StorageIcon />} iconPosition="start" />
            <Tab label="Commerce" icon={<PaymentIcon />} iconPosition="start" />
            <Tab label="Paiements" icon={<PaymentIcon />} iconPosition="start" />
            <Tab label="Email" icon={<EmailIcon />} iconPosition="start" />
            <Tab label="Sécurité" icon={<SecurityIcon />} iconPosition="start" />
          </Tabs>

          {/* Contenu des onglets */}
          <TabPanel value={activeTab} index={0}>
            {/* Paramètres généraux */}
            <ConfigurationSection
              title="Informations du site"
              action={
                <Button startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              }
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nom du site"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email de support"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description du site"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Devise par défaut</InputLabel>
                    <Select
                      value={settings.defaultCurrency}
                      label="Devise par défaut"
                      onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                    >
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Fuseau horaire</InputLabel>
                    <Select
                      value={settings.timezone}
                      label="Fuseau horaire"
                      onChange={(e) => handleSettingChange('timezone', e.target.value)}
                    >
                      <MenuItem value="Europe/Paris">Europe/Paris</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                      <MenuItem value="America/New_York">America/New_York</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </ConfigurationSection>

            <ConfigurationSection title="Maintenance">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Mode maintenance"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Lorsque activé, le site sera inaccessible aux visiteurs
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowRegistrations}
                        onChange={(e) => handleSettingChange('allowRegistrations', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Autoriser les inscriptions"
                  />
                </Grid>
              </Grid>
            </ConfigurationSection>

            <ConfigurationSection 
              title="Gestion du cache"
              action={
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={clearCache}
                  variant="outlined"
                  color="warning"
                >
                  Vider le cache
                </Button>
              }
            >
              <Typography variant="body2" color="text.secondary">
                Le cache système améliore les performances en stockant les données fréquemment utilisées.
                Le vider peut résoudre certains problèmes d'affichage.
              </Typography>
            </ConfigurationSection>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Paramètres commerce */}
            <ConfigurationSection
              title="Paramètres de vente"
              action={
                <Button startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              }
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Taux de taxe (%)"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Seuil livraison gratuite (€)"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => handleSettingChange('freeShippingThreshold', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Frais de livraison par défaut (€)"
                    value={settings.defaultShippingCost}
                    onChange={(e) => handleSettingChange('defaultShippingCost', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Taux de commission (%)"
                    value={settings.commissionRate}
                    onChange={(e) => handleSettingChange('commissionRate', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
              </Grid>
            </ConfigurationSection>

            <ConfigurationSection title="Politiques">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configurez les politiques de retour, de livraison et les conditions générales de vente.
              </Typography>
              <Button variant="outlined" startIcon={<EditIcon />}>
                Modifier les politiques
              </Button>
            </ConfigurationSection>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {/* Paramètres paiements */}
            <ConfigurationSection
              title="Méthodes de paiement"
              action={
                <Button startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              }
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.stripeEnabled}
                        onChange={(e) => handleSettingChange('stripeEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Stripe (Cartes de crédit)"
                  />
                  {settings.stripeEnabled && (
                    <Box sx={{ ml: 4, mt: 1 }}>
                      <TextField
                        label="Clé publique Stripe"
                        placeholder="pk_live_..."
                        fullWidth
                        margin="normal"
                        size="small"
                      />
                      <TextField
                        label="Clé secrète Stripe"
                        placeholder="sk_live_..."
                        fullWidth
                        margin="normal"
                        size="small"
                        type="password"
                      />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.paypalEnabled}
                        onChange={(e) => handleSettingChange('paypalEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="PayPal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cashOnDelivery}
                        onChange={(e) => handleSettingChange('cashOnDelivery', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Paiement à la livraison"
                  />
                </Grid>
              </Grid>
            </ConfigurationSection>
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {/* Paramètres email */}
            <ConfigurationSection
              title="Configuration email"
              action={
                <Button startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              }
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Activer les notifications email"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Types de notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.orderConfirmation}
                        onChange={(e) => handleSettingChange('orderConfirmation', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Confirmations de commande"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.shippingUpdates}
                        onChange={(e) => handleSettingChange('shippingUpdates', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Mises à jour de livraison"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.marketingEmails}
                        onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Emails marketing"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Serveur SMTP"
                    placeholder="smtp.votre-fournisseur.com"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Port SMTP"
                    placeholder="587"
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                  <TextField
                    label="Nom d'utilisateur SMTP"
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Mot de passe SMTP"
                    fullWidth
                    margin="normal"
                    type="password"
                  />
                </Grid>
              </Grid>
            </ConfigurationSection>
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            {/* Paramètres sécurité */}
            <ConfigurationSection
              title="Sécurité et authentification"
              action={
                <Button startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              }
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requireEmailVerification}
                        onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Vérification email requise"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Les utilisateurs doivent vérifier leur email pour pouvoir se connecter
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable2FA}
                        onChange={(e) => handleSettingChange('enable2FA', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Authentification à deux facteurs"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Tentatives de connexion max"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Timeout session (heures)"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                    fullWidth
                    margin="normal"
                    type="number"
                  />
                </Grid>
              </Grid>
            </ConfigurationSection>

            <ConfigurationSection titleJournal d'activité">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Consultez les connexions récentes et les activités suspectes.
              </Typography>
              <Button variant="outlined">
                Voir le journal de sécurité
              </Button>
            </ConfigurationSection>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
