'use client';

import { useState } from 'react';
import { UploadImage } from '../ui/UploadImage';
import { useUpload } from '../../hooks/useUpload';

export function ProductForm({ onSubmit, initialData = {} }) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    price: initialData.price || '',
    stockQuantity: initialData.stockQuantity || 0,
    categoryId: initialData.categoryId || '',
    images: initialData.images || []
  });

  const { uploadMultipleFiles, uploading } = useUpload();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleImageUpload = (images) => {
    setFormData(prev => ({
      ...prev,
      images: Array.isArray(images) ? images : [images]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nom du produit *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Prix (€) *
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0.01"
            step="0.01"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">
            Quantité en stock *
          </label>
          <input
            type="number"
            id="stockQuantity"
            name="stockQuantity"
            value={formData.stockQuantity}
            onChange={handleInputChange}
            min="0"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Catégorie *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionnez une catégorie</option>
            <option value="1">Électronique</option>
            <option value="2">Mode</option>
            <option value="3">Maison</option>
            <option value="4">Sport</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Upload d'images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Images du produit *
        </label>
        <UploadImage
          onUploadComplete={handleImageUpload}
          folder="products"
          userId="current-user-id" // À remplacer par l'ID utilisateur réel
          multiple={true}
          maxFiles={5}
          existingImages={formData.images}
        />
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploading || formData.images.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Upload en cours...' : 'Créer le produit'}
        </button>
      </div>
    </form>
  );
}
