import { query } from '../db.js';

export const createAvailability = async (providerId, availabilityData) => {
    const { day_of_week, start_time, end_time } = availabilityData;
    const text = `
        INSERT INTO provider_availabilities(provider_id, day_of_week, start_time, end_time)
        VALUES($1, $2, $3, $4) RETURNING *
    `;
    const values = [providerId, day_of_week, start_time, end_time];
    const result = await query(text, values);
    return result.rows[0];
};

export const findAvailabilitiesByProviderId = async (providerId) => {
    const text = 'SELECT * FROM provider_availabilities WHERE provider_id = $1 ORDER BY day_of_week, start_time';
    const values = [providerId];
    const result = await query(text, values);
    return result.rows;
};

export const findAvailabilityById = async (availabilityId) => {
    const text = 'SELECT * FROM provider_availabilities WHERE id = $1';
    const values = [availabilityId];
    const result = await query(text, values);
    return result.rows[0];
};

export const deleteAvailabilityById = async (availabilityId) => {
    const text = 'DELETE FROM provider_availabilities WHERE id = $1';
    const values = [availabilityId];
    await query(text, values);
};

