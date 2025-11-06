'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Email,
  ArrowBack
} from '@mui/icons-material';
import NextLink from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      await forgotPassword(email);
      setSuccess(true);
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'envoi du lien de réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* En-tête */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2c5530, #4a7c59)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            BuySell
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Mot de passe oublié
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saisissez votre email pour recevoir un lien de réinitialisation
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Un lien de réinitialisation a été envoyé à votre adresse email.
            Vérifiez votre boîte de réception et suivez les instructions.
          </Alert>
        )}

        {!success ? (
          /* Formulaire */
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              margin="normal"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
          </Box>
        ) : (
          /* Message de succès */
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'success.main',
                mx: 'auto',
                mb: 3
              }}
            >
              <Email sx={{ fontSize: 40 }} />
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Email envoyé !
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Consultez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="outlined"
                onClick={() => setSuccess(false)}
                fullWidth
              >
                Réessayer
              </Button>
              
              <Button
                component={NextLink}
                href="/auth/login"
                variant="text"
                startIcon={<ArrowBack />}
                fullWidth
              >
                Retour à la connexion
              </Button>
            </Box>
          </Box>
        )}

        {/* Lien retour */}
        {!success && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              component={NextLink}
              href="/auth/login"
              startIcon={<ArrowBack />}
              sx={{ color: 'text.secondary' }}
            >
              Retour à la connexion
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
