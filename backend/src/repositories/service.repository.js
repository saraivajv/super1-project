import { query } from '../db.js';

// --- Funções do Prestador ---

export const create = async (serviceData) => {
    const { title, description, service_type_id, provider_id } = serviceData;
    const result = await query(
        'INSERT INTO services (title, description, service_type_id, provider_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, description, service_type_id, provider_id]
    );
    return result.rows[0];
};

export const findByProviderId = async (provider_id) => {
    const result = await query(
        `SELECT 
            s.*,
            st.name as service_type_name,
            st.id as service_type_id_val,
            json_agg(json_build_object('id', sv.id, 'name', sv.name, 'price', sv.price, 'duration_minutes', sv.duration_minutes)) as variations
         FROM services s
         JOIN service_types st ON s.service_type_id = st.id
         LEFT JOIN service_variations sv ON s.id = sv.service_id
         WHERE s.provider_id = $1
         GROUP BY s.id, st.name, st.id`,
        [provider_id]
    );
    
    return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        is_active: row.is_active,
        service_type: {
            id: row.service_type_id_val,
            name: row.service_type_name
        },
        variations: (row.variations && row.variations.length > 0 && row.variations[0].id !== null) ? row.variations : []
    }));
};

export const findByIdAndProviderId = async (id, provider_id) => {
    const result = await query('SELECT * FROM services WHERE id = $1 AND provider_id = $2', [id, provider_id]);
    return result.rows[0];
};

export const findById = async (id) => {
    const result = await query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0];
};

export const update = async (id, serviceData) => {
    const { title, description, service_type_id } = serviceData;
    const result = await query(
        'UPDATE services SET title = $1, description = $2, service_type_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [title, description, service_type_id, id]
    );
    return result.rows[0];
};

export const remove = async (id) => {
    await query('DELETE FROM services WHERE id = $1', [id]);
};


export const createVariation = async (serviceId, variationData) => {
    const { name, price, duration_minutes } = variationData;
    const result = await query(
        'INSERT INTO service_variations (service_id, name, price, duration_minutes) VALUES ($1, $2, $3, $4) RETURNING *',
        [serviceId, name, price, duration_minutes]
    );
    return result.rows[0];
};

export const findVariationById = async (variationId) => {
    const result = await query('SELECT * FROM service_variations WHERE id = $1', [variationId]);
    return result.rows[0];
};

export const updateVariation = async (variationId, variationData) => {
    const { name, price, duration_minutes } = variationData;
    const result = await query(
        'UPDATE service_variations SET name = $1, price = $2, duration_minutes = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, price, duration_minutes, variationId]
    );
    return result.rows[0];
};

export const removeVariation = async (variationId) => {
    await query('DELETE FROM service_variations WHERE id = $1', [variationId]);
};


// --- Funções Públicas (Marketplace) ---

export const findAllPublic = async (serviceTypeId) => {
    let queryString = `
        SELECT 
            s.id, s.title, s.description,
            json_build_object('id', p.id, 'name', u.name) as provider,
            json_build_object('id', st.id, 'name', st.name) as service_type,
            (SELECT json_agg(json_build_object('id', sv.id, 'name', sv.name, 'price', sv.price, 'duration_minutes', sv.duration_minutes)) 
             FROM service_variations sv WHERE sv.service_id = s.id) as variations
        FROM services s
        JOIN providers p ON s.provider_id = p.id
        JOIN users u ON p.user_id = u.id
        JOIN service_types st ON s.service_type_id = st.id
        WHERE s.is_active = TRUE
    `;
    const queryParams = [];
    if (serviceTypeId) {
        queryString += ' AND s.service_type_id = $1';
        queryParams.push(serviceTypeId);
    }
    queryString += ' GROUP BY s.id, p.id, u.name, st.id, st.name';

    const result = await query(queryString, queryParams);
    return result.rows.map(row => ({
        ...row,
        variations: row.variations || []
    }));
};

export const findByIdPublic = async (id) => {
    const result = await query(`
        SELECT 
            s.id, s.title, s.description,
            json_build_object('id', p.id, 'name', u.name, 'email', u.email) as provider,
            json_build_object('id', st.id, 'name', st.name) as service_type,
            (SELECT json_agg(json_build_object('id', sv.id, 'name', sv.name, 'price', sv.price, 'duration_minutes', sv.duration_minutes)) 
             FROM service_variations sv WHERE sv.service_id = s.id) as variations,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id) as review_count
        FROM services s
        JOIN providers p ON s.provider_id = p.id
        JOIN users u ON p.user_id = u.id
        JOIN service_types st ON s.service_type_id = st.id
        LEFT JOIN service_variations sv_reviews ON s.id = sv_reviews.service_id
        LEFT JOIN bookings b ON sv_reviews.id = b.service_variation_id
        LEFT JOIN reviews r ON b.id = r.booking_id
        WHERE s.id = $1 AND s.is_active = TRUE
        GROUP BY s.id, p.id, u.name, u.email, st.id, st.name
    `, [id]);
    const service = result.rows[0];
    if (service) {
        service.variations = service.variations || [];
        service.average_rating = parseFloat(service.average_rating);
        service.review_count = parseInt(service.review_count, 10);
    }
    return service;
};

export const findAllTypes = async () => {
    const result = await query('SELECT id, name FROM service_types ORDER BY name');
    return result.rows;
};