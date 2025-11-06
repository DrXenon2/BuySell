'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  Save,
  ArrowBack,
  AddPhotoAlternate,
  Category,
  Inventory
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const steps = [
  'Informations de base',
  'Détails du produit',
  'Images et médias',
  'Révision et publication'
];

export default function CreateProductPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Étape 1: Informations de base
    name: '',
    description: '',
    categoryId: '',
    sku: '',
    brand: '',
    
    // Étape 2: Détails
    price: '',
    salePrice: '',
    stockQuantity: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    
    // Étape 3: Options
    isActive: true,
    isFeatured: false,
    isOnSale: false,
    lowStockThreshold: 10,
    
    // Étape 4: Spécifications
    specifications: {},
    tags: []
  });

  const router = useRouter();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!formData.name || !formData.description || !formData.price || !formData.stockQuantity) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Simulation de création
      console.log('Création produit:', formData);
      
      // Redirection après succès
      router.push('/admin/products');
    } catch (error) {
      setError(error.message || 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nom du produit *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description *"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={formData.categoryId}
                  label="Catégorie *"
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                >
                  <MenuItem value="1">Électronique</MenuItem>
                  <MenuItem value="2">Mode</MenuItem>
                  <MenuItem value="3">Maison</MenuItem>
                  <MenuItem value="4">Sport</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Marque"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="SKU (Référence)"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                fullWidth
                helperText="Référence unique du produit"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prix *"
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                fullWidth
                required
                InputProps={{
                  endAdornment: '€'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prix soldé"
                type="number"
                value={formData.salePrice}
                onChange={(e) => handleChange('salePrice', e.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: '€'
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Quantité en stock *"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleChange('stockQuantity', e.target.value)}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Seuil d'alerte stock"
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                fullWidth
                helperText="Alerte quand le stock est bas"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Poids (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle2" gutterBottom>
                Dimensions (cm)
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <TextField
                    label="Longueur"
                    type="number"
                    value={formData.dimensions.length}
                    onChange={(e) => handleChange('dimensions.length', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Largeur"
                    type="number"
                    value={formData.dimensions.width}
                    onChange={(e) => handleChange('dimensions.width', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="Hauteur"
                    type="number"
                    value={formData.dimensions.height}
                    onChange={(e) => handleChange('dimensions.height', e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.light + 08'
                  }
                }}
              >
                <AddPhotoAlternate sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Ajouter des images
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Glissez-déposez vos images ici ou cliquez pour parcourir
                </Typography>
                <Button variant="outlined">
                  Choisir des fichiers
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Options d'affichage
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => handleChange('isActive', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Produit actif"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isFeatured}
                        onChange={(e) => handleChange('isFeatured', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="En vedette"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isOnSale}
                        onChange={(e) => handleChange('isOnSale', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="En solde"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Récapitulatif
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Informations de base
                    </Typography>
                    <Typography variant="body2"><strong>Nom:</strong> {formData.name}</Typography>
                    <Typography variant="body2"><strong>Catégorie:</strong> {formData.categoryId}</Typography>
                    <Typography variant="body2"><strong>Marque:</strong> {formData.brand}</Typography>
                    <Typography variant="body2"><strong>SKU:</strong> {formData.sku}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Prix et stock
                    </Typography>
                    <Typography variant="body2"><strong>Prix:</strong> {formData.price} €</Typography>
                    <Typography variant="body2"><strong>Prix soldé:</strong> {formData.salePrice || 'Non'} €</Typography>
                    <Typography variant="body2"><strong>Stock:</strong> {formData.stockQuantity} unités</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="600">
                      Options
                    </Typography>
                    <Typography variant="body2">
                      <strong>Statut:</strong> {formData.isActive ? 'Actif' : 'Inactif'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>En vedette:</strong> {formData.isFeatured ? 'Oui' : 'Non'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>En solde:</strong> {formData.isOnSale ? 'Oui' : 'Non'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            component={Link}
            href="/admin/products"
            startIcon={<ArrowBack />}
            variant="outlined"
          >
            Retour
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Nouveau produit
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card className="admin-card">
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2 }}>
                    {renderStepContent(index)}
                    
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleBack}
                        disabled={index === 0}
                      >
                        Retour
                      </Button>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? handleSubmit : handleNext}
                        disabled={loading}
                        startIcon={index === steps.length - 1 ? <Save /> : null}
                      >
                        {index === steps.length - 1 
                          ? (loading ? 'Création...' : 'Créer le produit')
                          : 'Continuer'
                        }
                      </Button>
                    </Box>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Produit créé avec succès !
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
