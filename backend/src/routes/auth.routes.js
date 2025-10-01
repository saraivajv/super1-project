import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();

// Rota para registro de usuário
// POST /api/auth/register
router.post('/register', register);

// Rota para login de usuário
// POST /api/auth/login
router.post('/login', login);

export default router;
