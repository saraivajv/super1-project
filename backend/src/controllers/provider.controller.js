import * as availabilityRepo from '../repositories/availability.repository.js';
import * as providerRepo from '../repositories/provider.repository.js';
import * as serviceRepo from '../repositories/service.repository.js';
import { deleteServiceFromIndex, indexService } from '../services/indexing.service.js';

// --- Serviços ---

export const getMyServices = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }
        const services = await serviceRepo.findByProviderId(provider.id);
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar serviços.", error: error.message });
    }
};

export const createService = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }

        const serviceData = {
            title: req.body.title,
            description: req.body.description,
            service_type_id: req.body.service_type_id,
            provider_id: provider.id 
        };
        
        const newService = await serviceRepo.create(serviceData);

        // Após criar no DB, indexa no Elasticsearch
        await indexService(newService.id);

        res.status(201).json(newService);
    } catch (error) {
        console.error("Erro no controlador createService:", error);
        res.status(500).json({ message: "Erro ao criar serviço.", error: error.message });
    }
};

export const updateService = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }
        const service = await serviceRepo.findByIdAndProviderId(req.params.id, provider.id);
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado ou não pertence a você." });
        }
        const updatedService = await serviceRepo.update(req.params.id, req.body);
        
        // Após atualizar no DB, reindexa no Elasticsearch
        await indexService(updatedService.id);

        res.status(200).json(updatedService);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar serviço.", error: error.message });
    }
};

export const deleteService = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }
        const service = await serviceRepo.findByIdAndProviderId(req.params.id, provider.id);
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado ou não pertence a você." });
        }
        const serviceId = req.params.id;
        await serviceRepo.remove(serviceId);

        // Após apagar do DB, remove do Elasticsearch
        await deleteServiceFromIndex(serviceId);

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar serviço.", error: error.message });
    }
};

// --- Variações de Serviço ---

export const createServiceVariation = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const provider = await providerRepo.findByUserId(req.user.id);
        const service = await serviceRepo.findByIdAndProviderId(serviceId, provider.id);
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado ou não pertence a você." });
        }
        const newVariation = await serviceRepo.createVariation(serviceId, req.body);
        res.status(201).json(newVariation);
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar variação de serviço.", error: error.message });
    }
};

export const updateServiceVariation = async (req, res) => {
    try {
        const { variationId } = req.params;
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }

        const variation = await serviceRepo.findVariationById(variationId);
        if (!variation) {
            return res.status(404).json({ message: "Variação não encontrada." });
        }

        const service = await serviceRepo.findByIdAndProviderId(variation.service_id, provider.id);
        if (!service) {
            return res.status(403).json({ message: "Você não tem permissão para editar esta variação." });
        }

        const updatedVariation = await serviceRepo.updateVariation(variationId, req.body);
        res.status(200).json(updatedVariation);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar variação.", error: error.message });
    }
};

export const deleteServiceVariation = async (req, res) => {
    try {
        const { variationId } = req.params;
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }

        const variation = await serviceRepo.findVariationById(variationId);
        if (!variation) {
            return res.status(404).json({ message: "Variação não encontrada." });
        }

        const service = await serviceRepo.findByIdAndProviderId(variation.service_id, provider.id);
        if (!service) {
            return res.status(403).json({ message: "Você não tem permissão para apagar esta variação." });
        }
        
        await serviceRepo.removeVariation(variationId);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar variação.", error: error.message });
    }
};

// --- Disponibilidade ---

export const getMyAvailabilities = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }
        const availabilities = await availabilityRepo.findByProviderId(provider.id);
        res.status(200).json(availabilities);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar disponibilidades.", error: error.message });
    }
};

export const createAvailability = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        const newAvailability = await availabilityRepo.create({ ...req.body, provider_id: provider.id });
        res.status(201).json(newAvailability);
    } catch (error) {
        res.status(500).json({ message: "Erro ao criar disponibilidade.", error: error.message });
    }
};

export const deleteAvailability = async (req, res) => {
    try {
        const provider = await providerRepo.findByUserId(req.user.id);
        const availability = await availabilityRepo.findByIdAndProviderId(req.params.id, provider.id);
        if (!availability) {
            return res.status(404).json({ message: "Disponibilidade não encontrada ou não pertence a você." });
        }
        await availabilityRepo.remove(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Erro ao apagar disponibilidade.", error: error.message });
    }
};

