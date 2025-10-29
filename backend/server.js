const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Buy-Sell Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics' },
      { id: 2, name: 'Smart Watch', price: 199.99, category: 'Electronics' },
      { id: 3, name: 'Laptop Bag', price: 49.99, category: 'Accessories' },
      { id: 4, name: 'Portable Charger', price: 29.99, category: 'Electronics' },
      { id: 5, name: 'Phone Case', price: 19.99, category: 'Accessories' },
      { id: 6, name: 'Bluetooth Speaker', price: 79.99, category: 'Electronics' }
    ]
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const products = [
    { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', description: 'High-quality wireless headphones with noise cancellation' },
    { id: 2, name: 'Smart Watch', price: 199.99, category: 'Electronics', description: 'Feature-rich smartwatch with health tracking' },
    { id: 3, name: 'Laptop Bag', price: 49.99, category: 'Accessories', description: 'Durable laptop bag with multiple compartments' },
  ];
  
  const product = products.find(p => p.id === parseInt(id));
  
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    res.json({
      message: 'Login successful',
      user: {
        id: 1,
        email: email,
        name: 'Test User'
      },
      token: 'sample-jwt-token'
    });
  } else {
    res.status(400).json({ error: 'Email and password are required' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (name && email && password) {
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: 1,
        name: name,
        email: email
      }
    });
  } else {
    res.status(400).json({ error: 'All fields are required' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, 'localhost', () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
