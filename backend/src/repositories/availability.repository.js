import { query } from '../db.js';

export const create = async (availabilityData) => {
    const { day_of_week, start_time, end_time, provider_id } = availabilityData;
    const result = await query(
        'INSERT INTO provider_availabilities (day_of_week, start_time, end_time, provider_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [day_of_week, start_time, end_time, provider_id]
    );
    return result.rows[0];
};

export const findByProviderId = async (providerId) => {
    const result = await query('SELECT * FROM provider_availabilities WHERE provider_id = $1 ORDER BY day_of_week', [providerId]);
    return result.rows;
};

export const findByIdAndProviderId = async (id, providerId) => {
    const result = await query('SELECT * FROM provider_availabilities WHERE id = $1 AND provider_id = $2', [id, providerId]);
    return result.rows[0];
};

export const remove = async (id) => {
    await query('DELETE FROM provider_availabilities WHERE id = $1', [id]);
};

export const findAvailabilityByDay = async (providerId, dayOfWeek) => {
    const result = await query(
        'SELECT * FROM provider_availabilities WHERE provider_id = $1 AND day_of_week = $2',
        [providerId, dayOfWeek]
    );
    return result.rows[0];
}
