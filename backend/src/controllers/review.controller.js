import * as bookingRepo from '../repositories/booking.repository.js';
import * as reviewRepo from '../repositories/review.repository.js';

export const createReview = async (req, res) => {
    const { bookingId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    try {
        const booking = await bookingRepo.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Reserva não encontrada." });
        }
        if (booking.client_id !== userId) {
            return res.status(403).json({ message: "Você não tem permissão para avaliar esta reserva." });
        }
        if (booking.status !== 'completed') {
            return res.status(400).json({ message: "Só é possível avaliar reservas concluídas." });
        }

        const existingReview = await reviewRepo.findByBookingId(bookingId);
        if (existingReview) {
            return res.status(409).json({ message: "Esta reserva já foi avaliada." });
        }

        const newReview = await reviewRepo.create({ booking_id: bookingId, user_id: userId, rating, comment });
        res.status(201).json(newReview);

    } catch (error) {
        res.status(500).json({ message: "Erro ao criar avaliação.", error: error.message });
    }
};

export const getServiceReviews = async (req, res) => {
    try {
        const reviews = await reviewRepo.findByServiceId(req.params.serviceId);
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar avaliações.", error: error.message });
    }
};
