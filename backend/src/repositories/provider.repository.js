import { query } from '../db.js';

/**
 * Cria um novo perfil de prestador associado a um usuário.
 * @param {string} userId - O UUID do usuário para o qual criar o perfil de prestador.
 * @param {object} client - O cliente de banco de dados para usar em uma transação.
 * @returns {Promise<object>} O perfil do prestador criado.
 */
export const create = async (userId, client) => {
    const text = 'INSERT INTO providers(user_id) VALUES($1) RETURNING *';
    const values = [userId];

    const dbClient = client || query;
    const result = await dbClient(text, values);
    return result.rows[0];
};

/**
 * Encontra um perfil de prestador pelo ID do usuário.
 * @param {string} userId - O UUID do usuário.
 * @returns {Promise<object|undefined>} O objeto do prestador ou undefined.
 */
export const findByUserId = async (userId) => {
    const text = 'SELECT * FROM providers WHERE user_id = $1';
    const values = [userId];
    const result = await query(text, values);
    return result.rows[0];
};
