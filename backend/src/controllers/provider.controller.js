import * as availabilityRepo from '../repositories/availability.repository.js';
import * as providerRepo from '../repositories/provider.repository.js';
import * as serviceRepo from '../repositories/service.repository.js';

// Função auxiliar para obter o providerId a partir do userId
const getProviderId = async (userId) => {
    const provider = await providerRepo.findByUserId(userId);
    if (!provider) throw new Error('Perfil de prestador não encontrado.');
    return provider.id;
};

// --- CRUD de Serviços ---

export const createService = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        // TODO: Validar se o service_type_id existe
        const newService = await serviceRepo.createService(providerId, req.body);
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyServices = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const services = await serviceRepo.findServicesByProviderId(providerId);
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateService = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const service = await serviceRepo.findServiceById(req.params.id);
        if (!service || service.provider_id !== providerId) {
            return res.status(404).json({ message: 'Serviço não encontrado ou não pertence a este prestador.' });
        }
        const updatedService = await serviceRepo.updateServiceById(req.params.id, req.body);
        res.status(200).json(updatedService);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteService = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const service = await serviceRepo.findServiceById(req.params.id);
        if (!service || service.provider_id !== providerId) {
            return res.status(404).json({ message: 'Serviço não encontrado ou não pertence a este prestador.' });
        }
        await serviceRepo.deleteServiceById(req.params.id);
        res.status(204).send(); // 204 No Content
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- CRUD de Variações de Serviço ---

export const createVariation = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const providerId = await getProviderId(req.user.id);
        const service = await serviceRepo.findServiceById(serviceId);
        if (!service || service.provider_id !== providerId) {
            return res.status(404).json({ message: 'Serviço não encontrado ou não pertence a este prestador.' });
        }
        const newVariation = await serviceRepo.createVariation(serviceId, req.body);
        res.status(201).json(newVariation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateVariation = async (req, res) => {
    try {
        const { variationId } = req.params;
        const providerId = await getProviderId(req.user.id);
        const variation = await serviceRepo.findVariationById(variationId);
        if (!variation) {
            return res.status(404).json({ message: 'Variação não encontrada.' });
        }
        const service = await serviceRepo.findServiceById(variation.service_id);
        if (!service || service.provider_id !== providerId) {
            return res.status(403).json({ message: 'Acesso negado a esta variação.' });
        }
        const updatedVariation = await serviceRepo.updateVariationById(variationId, req.body);
        res.status(200).json(updatedVariation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteVariation = async (req, res) => {
    try {
        const { variationId } = req.params;
        const providerId = await getProviderId(req.user.id);
        const variation = await serviceRepo.findVariationById(variationId);
         if (!variation) {
            return res.status(404).json({ message: 'Variação não encontrada.' });
        }
        const service = await serviceRepo.findServiceById(variation.service_id);
        if (!service || service.provider_id !== providerId) {
            return res.status(403).json({ message: 'Acesso negado a esta variação.' });
        }
        await serviceRepo.deleteVariationById(variationId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- CRUD de Disponibilidade ---

export const createAvailability = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const newAvailability = await availabilityRepo.createAvailability(providerId, req.body);
        res.status(201).json(newAvailability);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyAvailabilities = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const availabilities = await availabilityRepo.findAvailabilitiesByProviderId(providerId);
        res.status(200).json(availabilities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAvailability = async (req, res) => {
    try {
        const providerId = await getProviderId(req.user.id);
        const availability = await availabilityRepo.findAvailabilityById(req.params.id);
        if (!availability || availability.provider_id !== providerId) {
            return res.status(404).json({ message: 'Disponibilidade não encontrada ou não pertence a este prestador.' });
        }
        await availabilityRepo.deleteAvailabilityById(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

