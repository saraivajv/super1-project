import pool from '../db.js';
import * as bookingRepository from '../repositories/booking.repository.js';
import * as providerRepository from '../repositories/provider.repository.js';
import * as serviceRepository from '../repositories/service.repository.js';

export const createBooking = async (req, res) => {
    const { service_variation_id, start_time } = req.body;
    const clientId = req.user.id; // ID do cliente logado (vem do authMiddleware)

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const variation = await serviceRepository.findVariationById(service_variation_id);
        if (!variation) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Variação de serviço não encontrada." });
        }

        const service = await serviceRepository.findById(variation.service_id);
        const providerId = service.provider_id;

        const startTimeObj = new Date(start_time);
        const endTimeObj = new Date(startTimeObj.getTime() + variation.duration_minutes * 60000);

        const isOverlap = await bookingRepository.checkOverlap(providerId, startTimeObj, endTimeObj, client);
        if (isOverlap) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: "Este horário já está reservado." });
        }

        const newBooking = await bookingRepository.create({
            client_id: clientId,
            provider_id: providerId,
            service_variation_id,
            date: startTimeObj.toISOString().split('T')[0],
            start_time: startTimeObj,
            end_time: endTimeObj,
            status: 'confirmed'
        }, client);

        await client.query('COMMIT');
        res.status(201).json(newBooking);

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: "Erro ao criar reserva.", error: error.message });
    } finally {
        client.release();
    }
};

export const getClientBookings = async (req, res) => {
    try {
        const bookings = await bookingRepository.findByClientId(req.user.id);
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar suas reservas.", error: error.message });
    }
};

export const getProviderBookings = async (req, res) => {
    try {
        const provider = await providerRepository.findByUserId(req.user.id);
        if (!provider) {
            return res.status(404).json({ message: "Perfil de prestador não encontrado." });
        }
        const bookings = await bookingRepository.findByProviderId(provider.id);
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar reservas recebidas.", error: error.message });
    }
};

export const updateBookingStatus = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;
        const user = req.user;

        const booking = await bookingRepository.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Reserva não encontrada." });
        }

        const provider = await providerRepository.findByUserId(user.id);

        if (booking.client_id !== user.id && (!provider || booking.provider_id !== provider.id)) {
            return res.status(403).json({ message: "Você não tem permissão para alterar esta reserva." });
        }
        
        const updatedBooking = await bookingRepository.updateStatus(bookingId, status);
        res.status(200).json(updatedBooking);

    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar o status da reserva.", error: error.message });
    }
};
