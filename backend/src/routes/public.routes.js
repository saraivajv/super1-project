import { Router } from 'express';
import * as publicController from '../controllers/public.controller.js';

const router = Router();

router.get('/services', publicController.getAllServices);
router.get('/services/:id', publicController.getServiceById);
router.get('/service-types', publicController.getAllServiceTypes);

router.get('/providers/:providerId/availability', publicController.getAvailableSlots);


export default router;
