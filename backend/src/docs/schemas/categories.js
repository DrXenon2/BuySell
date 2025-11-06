/**
 * Schémas OpenAPI pour les catégories
 */

module.exports = {
  Category: {
    type: 'object',
    required: ['name'],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', maxLength: 100 },
      description: { type: 'string', maxLength: 500 },
      slug: { type: 'string' },
      parentId: { type: 'integer', nullable: true },
      image: { type: 'string', format: 'uri' },
      isActive: { type: 'boolean' }
    }
  }
};
