import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import authRoutes from './routes/auth.routes.js';
import providerRoutes from './routes/provider.routes.js';
// NOVAS importações
import bookingRoutes from './routes/booking.routes.js';
import publicRoutes from './routes/public.routes.js';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json());

// Rotas de Autenticação
app.use('/api/auth', authRoutes);

// Rotas do Prestador
app.use('/api/provider', providerRoutes);

// NOVAS Rotas Públicas
app.use('/api', publicRoutes);

// NOVAS Rotas de Booking
app.use('/api', bookingRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});

