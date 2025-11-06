import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { adminService } from '../services/adminService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

const ReportCard = ({ title, value, change, icon, subtitle }) => (
  <Card className="admin-card">
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography className="admin-card-title" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography className="admin-card-value">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: 'primary.main' }}>
          {icon}
        </Box>
      </Box>
      
      {change !== undefined && (
        <Box className={`admin-card-change ${change >= 0 ? 'change-positive' : 'change-negative'}`}>
          {change >= 0 ? <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} /> : <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} />}
          {Math.abs(change)}% vs période précédente
        </Box>
      )}
    </CardContent>
  </Card>
);

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`report-tabpanel-${index}`}
    aria-labelledby={`report-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

export default function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [reportType, setReportType] = useState('monthly');
  const [salesReport, setSalesReport] = useState({});
  const [productsReport, setProductsReport] = useState({});
  const [usersReport, setUsersReport] = useState({});

  useEffect(() => {
    loadReports();
  }, [dateRange, reportType]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const [salesData, productsData, usersData] = await Promise.all([
        adminService.getSalesReport({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          type: reportType
        }),
        adminService.getProductsReport({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        }),
        adminService.getUsersReport({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        })
      ]);

      setSalesReport(salesData);
      setProductsReport(productsData);
      setUsersReport(usersData);
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      setError('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const blob = await adminService.exportReport(type, {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rapport-${type}-${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      setError('Erreur lors de l\'export du rapport');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Rapports et Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analysez les performances de votre plateforme
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={loadReports}>
                <RefreshIcon sx={{ mr: 0.5 }} />
                Réessayer
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Filtres */}
        <Card className="admin-card" sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="end">
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date de début"
                  value={dateRange.startDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Date de fin"
                  value={dateRange.endDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type de rapport</InputLabel>
                  <Select
                    value={reportType}
                    label="Type de rapport"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="daily">Quotidien</MenuItem>
                    <MenuItem value="weekly">Hebdomadaire</MenuItem>
                    <MenuItem value="monthly">Mensuel</MenuItem>
                    <MenuItem value="yearly">Annuel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadReports}
                    disabled={loading}
                  >
                    Actualiser
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('excel')}
                    disabled={loading}
                  >
                    Excel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Navigation par onglets */}
        <Card className="admin-card">
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Ventes" />
              <Tab label="Produits" />
              <Tab label="Utilisateurs" />
              <Tab label="Performance" />
            </Tabs>

            {/* Contenu des onglets */}
            <TabPanel value={activeTab} index={0}>
              {/* Rapport des ventes */}
              {loading ? (
                <LinearProgress />
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Chiffre d'affaires"
                      value={`${salesReport.totalRevenue?.toLocaleString() || 0} €`}
                      change={salesReport.revenueChange}
                      icon={<MoneyIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Commandes"
                      value={salesReport.totalOrders?.toLocaleString() || 0}
                      change={salesReport.ordersChange}
                      icon={<CartIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Panier moyen"
                      value={`${salesReport.averageOrderValue?.toLocaleString() || 0} €`}
                      change={salesReport.aovChange}
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Taux de conversion"
                      value={`${salesReport.conversionRate || 0}%`}
                      change={salesReport.conversionChange}
                      icon={<PeopleIcon />}
                    />
                  </Grid>

                  {/* Tableau des ventes détaillées */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Détail des ventes
                    </Typography>
                    <TableContainer component={Paper} className="admin-table-container">
                      <Table className="admin-table">
                        <TableHead>
                          <TableRow>
                            <th>Période</th>
                            <th>Commandes</th>
                            <th>Chiffre d'affaires</th>
                            <th>Panier moyen</th>
                            <th>Nouveaux clients</th>
                            <th>Taux de croissance</th>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesReport.detailedData?.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.period}</TableCell>
                              <TableCell>{row.orders}</TableCell>
                              <TableCell>{row.revenue} €</TableCell>
                              <TableCell>{row.averageOrderValue} €</TableCell>
                              <TableCell>{row.newCustomers}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${row.growthRate}%`}
                                  size="small"
                                  color={row.growthRate >= 0 ? 'success' : 'error'}
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              {/* Rapport produits */}
              {loading ? (
                <LinearProgress />
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <ReportCard
                      title="Produits vendus"
                      value={productsReport.totalSold || 0}
                      change={productsReport.soldChange}
                      icon={<CartIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ReportCard
                      title="Produits en stock"
                      value={productsReport.inStock || 0}
                      subtitle={`${productsReport.lowStock || 0} en stock bas`}
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ReportCard
                      title="Top catégorie"
                      value={productsReport.topCategory?.name || 'N/A'}
                      subtitle={`${productsReport.topCategory?.revenue || 0} €`}
                      icon={<MoneyIcon />}
                    />
                  </Grid>

                  {/* Top produits */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Produits les plus vendus
                    </Typography>
                    <TableContainer component={Paper} className="admin-table-container">
                      <Table className="admin-table">
                        <TableHead>
                          <TableRow>
                            <th>Produit</th>
                            <th>Catégorie</th>
                            <th>Quantité vendue</th>
                            <th>Chiffre d'affaires</th>
                            <th>Stock restant</th>
                            <th>Taux de vente</th>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {productsReport.topProducts?.map((product, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box
                                    component="img"
                                    src={product.image || '/images/placeholder-product.jpg'}
                                    sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
                                  />
                                  <Typography variant="body2" fontWeight="500">
                                    {product.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{product.category}</TableCell>
                              <TableCell>{product.quantitySold}</TableCell>
                              <TableCell>{product.revenue} €</TableCell>
                              <TableCell>
                                <Chip 
                                  label={product.stock}
                                  size="small"
                                  color={product.stock < 10 ? 'error' : product.stock < 20 ? 'warning' : 'success'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${product.sellThroughRate}%`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {/* Rapport utilisateurs */}
              {loading ? (
                <LinearProgress />
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Nouveaux utilisateurs"
                      value={usersReport.newUsers || 0}
                      change={usersReport.newUsersChange}
                      icon={<PeopleIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Utilisateurs actifs"
                      value={usersReport.activeUsers || 0}
                      change={usersReport.activeUsersChange}
                      icon={<TrendingUpIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="Taux de rétention"
                      value={`${usersReport.retentionRate || 0}%`}
                      change={usersReport.retentionChange}
                      icon={<CalendarIcon />}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ReportCard
                      title="CLV moyen"
                      value={`${usersReport.averageCLV || 0} €`}
                      change={usersReport.clvChange}
                      icon={<MoneyIcon />}
                    />
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              {/* Performance globale */}
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Tableaux de bord de performance avancés
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Intégration avec Google Analytics ou outils BI à prévoir
                </Typography>
                <Button variant="outlined" startIcon={<DownloadIcon />}>
                  Exporter les données brutes
                </Button>
              </Box>
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
}
