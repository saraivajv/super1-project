import { query } from '../db.js';

export const create = async (reviewData) => {
    const { booking_id, user_id, rating, comment } = reviewData;
    const result = await query(
        'INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
        [booking_id, user_id, rating, comment]
    );
    return result.rows[0];
};

export const findByBookingId = async (bookingId) => {
    const result = await query('SELECT * FROM reviews WHERE booking_id = $1', [bookingId]);
    return result.rows[0];
};

export const findByServiceId = async (serviceId) => {
    const result = await query(`
        SELECT r.rating, r.comment, r.created_at, u.name as user_name
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.id
        JOIN service_variations sv ON b.service_variation_id = sv.id
        JOIN users u ON r.user_id = u.id
        WHERE sv.service_id = $1
        ORDER BY r.created_at DESC
    `, [serviceId]);
    return result.rows;
};
