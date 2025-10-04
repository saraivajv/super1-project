import cors from 'cors';
import 'dotenv/config';
import express from 'express';

import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import providerRoutes from './routes/provider.routes.js';
import publicRoutes from './routes/public.routes.js';
import reviewRoutes from './routes/review.routes.js';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api', publicRoutes);
app.use('/api', bookingRoutes);
app.use('/api', reviewRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});

