const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

// Test route
app.get('/', (req, res) => res.send('API is running...'));

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
