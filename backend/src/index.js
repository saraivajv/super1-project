import 'dotenv/config';
import express from 'express';
import { authMiddleware } from './middleware/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import providerRoutes from './routes/provider.routes.js';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

// Middlewares
app.use(express.json()); // Para parsear o corpo das requisições como JSON

// Rotas públicas
app.get('/api', (req, res) => {
  res.json({ message: 'API is running!' });
});

// Rotas de Autenticação
app.use('/api/auth', authRoutes);

// Rotas do Prestador (Protegidas)
app.use('/api/provider', providerRoutes);

// Rota protegida de exemplo
app.get('/api/profile', authMiddleware, (req, res) => {
    // Graças ao authMiddleware, temos acesso a req.user
    res.json({
        message: "Você está acessando uma rota protegida!",
        user: req.user
    });
});


app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});

