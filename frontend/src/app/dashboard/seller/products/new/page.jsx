'use client';

import { ProductForm } from '../../../components/forms/ProductForm';
import { useAuth } from '../../../hooks/useAuth';

export default function NewProductPage() {
  const { user } = useAuth();

  const handleSubmit = async (productData) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          sellerId: user.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirection ou message de succès
        alert('Produit créé avec succès!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Erreur lors de la création du produit');
    }
  };

  if (!user) {
    return <div>Veuillez vous connecter pour créer un produit</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Créer un nouveau produit
      </h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ProductForm 
          onSubmit={handleSubmit}
          userId={user.id}
        />
      </div>
    </div>
  );
}
