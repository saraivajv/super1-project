import * as availabilityRepository from '../repositories/availability.repository.js';
import * as bookingRepository from '../repositories/booking.repository.js';
import * as serviceRepository from '../repositories/service.repository.js';

export const getAllServices = async (req, res) => {
    try {
        const services = await serviceRepository.findAllPublic(req.query.type);
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar serviços.", error: error.message });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const service = await serviceRepository.findByIdPublic(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado." });
        }
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar detalhes do serviço.", error: error.message });
    }
};

export const getAllServiceTypes = async (req, res) => {
    try {
        const serviceTypes = await serviceRepository.findAllTypes();
        res.status(200).json(serviceTypes);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar tipos de serviço.", error: error.message });
    }
};

export const getAvailableSlots = async (req, res) => {
    const { providerId } = req.params;
    const { date, duration } = req.query;

    if (!date || !duration) {
        return res.status(400).json({ message: "A data e a duração do serviço são obrigatórias." });
    }

    try {
        const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();
        
        const providerSchedule = await availabilityRepository.findAvailabilityByDay(providerId, dayOfWeek);
        
        if (!providerSchedule) {
            return res.json([]);
        }

        const existingBookings = await bookingRepository.findByProviderAndDate(providerId, date);

        const slots = [];
        const slotInterval = 15;
        const serviceDuration = parseInt(duration, 10);

        let currentTime = new Date(`${date}T${providerSchedule.start_time}Z`);
        const endTime = new Date(`${date}T${providerSchedule.end_time}Z`);

        while (new Date(currentTime.getTime() + serviceDuration * 60000) <= endTime) {
            const slotStartTime = new Date(currentTime);
            const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

            let isOverlapping = false;
            for (const booking of existingBookings) {
                const bookingStartTime = new Date(booking.start_time);
                const bookingEndTime = new Date(booking.end_time);
                if (slotStartTime < bookingEndTime && slotEndTime > bookingStartTime) {
                    isOverlapping = true;
                    break;
                }
            }
            
            slots.push({
                time: slotStartTime.toUTCString().substring(17, 22),
                available: !isOverlapping,
            });

            currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
        }

        res.status(200).json(slots);

    } catch (error) {
        console.error("Erro ao calcular horários:", error);
        res.status(500).json({ message: "Erro ao calcular horários disponíveis.", error: error.message });
    }
};

