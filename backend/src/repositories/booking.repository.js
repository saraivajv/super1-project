import { query } from '../db.js';

export const findByProviderAndDate = async (providerId, date) => {
    const result = await query(
        `SELECT start_time, end_time FROM bookings 
         WHERE provider_id = $1 AND date = $2 AND status != 'cancelled'`,
        [providerId, date]
    );
    return result.rows;
};

export const checkOverlap = async (providerId, startTime, endTime, client) => {
    const dbClient = client || query;
    const result = await dbClient(
        `SELECT id FROM bookings 
         WHERE provider_id = $1 AND status != 'cancelled' AND 
         (start_time, end_time) OVERLAPS ($2, $3)`,
        [providerId, startTime, endTime]
    );
    return result.rows.length > 0;
};

export const create = async (bookingData, client) => {
    const { client_id, provider_id, service_variation_id, date, start_time, end_time, status } = bookingData;
    const dbClient = client || query;
    const result = await dbClient(
        `INSERT INTO bookings (client_id, provider_id, service_variation_id, date, start_time, end_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [client_id, provider_id, service_variation_id, date, start_time, end_time, status]
    );
    return result.rows[0];
};

const bookingDetailsQuery = `
    SELECT 
        b.id, b.date, b.start_time, b.end_time, b.status,
        json_build_object(
            'price', sv.price,
            'duration_minutes', sv.duration_minutes,
            'service', json_build_object(
                'title', s.title,
                'provider', json_build_object('name', up.name)
            )
        ) as service_variation,
        json_build_object('name', uc.name, 'email', uc.email) as client
    FROM bookings b
    JOIN service_variations sv ON b.service_variation_id = sv.id
    JOIN services s ON sv.service_id = s.id
    JOIN providers p ON b.provider_id = p.id
    JOIN users up ON p.user_id = up.id
    JOIN users uc ON b.client_id = uc.id
`;

export const findByProviderId = async (providerId) => {
    const result = await query(`${bookingDetailsQuery} WHERE b.provider_id = $1 ORDER BY b.start_time DESC`, [providerId]);
    return result.rows;
};

export const findByClientId = async (clientId) => {
    const result = await query(`${bookingDetailsQuery} WHERE b.client_id = $1 ORDER BY b.start_time DESC`, [clientId]);
    return result.rows;
};

export const findById = async (id) => {
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
};

export const updateStatus = async (id, status) => {
    const result = await query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
    );
    return result.rows[0];
};
