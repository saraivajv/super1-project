import { Router } from 'express';
import * as providerController from '../controllers/provider.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/role.middleware.js';

const router = Router();

// Middleware para todas as rotas de prestador:
// 1. Precisa estar autenticado (authMiddleware)
// 2. Precisa ter a role 'provider' (roleMiddleware)
router.use(authMiddleware, roleMiddleware(['provider']));

// --- Rotas de Serviços ---
router.route('/services')
    .post(providerController.createService)
    .get(providerController.getMyServices);

router.route('/services/:id')
    .put(providerController.updateService)
    .delete(providerController.deleteService);

// --- Rotas de Variações de Serviço ---
router.post('/services/:serviceId/variations', providerController.createVariation);
router.put('/variations/:variationId', providerController.updateVariation);
router.delete('/variations/:variationId', providerController.deleteVariation);


// --- Rotas de Disponibilidade ---
router.route('/availabilities')
    .post(providerController.createAvailability)
    .get(providerController.getMyAvailabilities);

router.delete('/availabilities/:id', providerController.deleteAvailability);

export default router;

