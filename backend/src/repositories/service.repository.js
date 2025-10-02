import { query } from '../db.js';

// --- Funções do Serviço ---

export const createService = async (providerId, serviceData) => {
    const { title, description, service_type_id } = serviceData;
    const text = `
        INSERT INTO services(provider_id, title, description, service_type_id)
        VALUES($1, $2, $3, $4) RETURNING *
    `;
    const values = [providerId, title, description, service_type_id];
    const result = await query(text, values);
    return result.rows[0];
};

export const findServicesByProviderId = async (providerId) => {
    const text = 'SELECT * FROM services WHERE provider_id = $1 ORDER BY created_at DESC';
    const values = [providerId];
    const result = await query(text, values);
    return result.rows;
};

export const findServiceById = async (serviceId) => {
    const text = 'SELECT * FROM services WHERE id = $1';
    const values = [serviceId];
    const result = await query(text, values);
    return result.rows[0];
};

export const updateServiceById = async (serviceId, serviceData) => {
    const { title, description, is_active } = serviceData;
    const text = `
        UPDATE services
        SET title = $1, description = $2, is_active = $3, updated_at = NOW()
        WHERE id = $4 RETURNING *
    `;
    const values = [title, description, is_active, serviceId];
    const result = await query(text, values);
    return result.rows[0];
};

export const deleteServiceById = async (serviceId) => {
    const text = 'DELETE FROM services WHERE id = $1';
    const values = [serviceId];
    await query(text, values);
};


// --- Funções da Variação de Serviço ---

export const createVariation = async (serviceId, variationData) => {
    const { name, price, duration_minutes } = variationData;
    const text = `
        INSERT INTO service_variations(service_id, name, price, duration_minutes)
        VALUES($1, $2, $3, $4) RETURNING *
    `;
    const values = [serviceId, name, price, duration_minutes];
    const result = await query(text, values);
    return result.rows[0];
};

export const findVariationById = async (variationId) => {
    const text = 'SELECT * FROM service_variations WHERE id = $1';
    const values = [variationId];
    const result = await query(text, values);
    return result.rows[0];
};

export const updateVariationById = async (variationId, variationData) => {
    const { name, price, duration_minutes } = variationData;
    const text = `
        UPDATE service_variations
        SET name = $1, price = $2, duration_minutes = $3, updated_at = NOW()
        WHERE id = $4 RETURNING *
    `;
    const values = [name, price, duration_minutes, variationId];
    const result = await query(text, values);
    return result.rows[0];
};

export const deleteVariationById = async (variationId) => {
    const text = 'DELETE FROM service_variations WHERE id = $1';
    const values = [variationId];
    await query(text, values);
};

