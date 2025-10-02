import { query } from '../db.js';

/**
 * Cria um novo perfil de prestador associado a um usuário.
 * @param {string} userId - O UUID do usuário para o qual criar o perfil de prestador.
 * @param {object} client - O cliente de banco de dados para usar em uma transação.
 * @returns {Promise<void>}
 */
export const create = async (userId, client) => {
    const text = 'INSERT INTO providers(user_id) VALUES($1)';
    const values = [userId];

    const dbClient = client || query;
    await dbClient(text, values);
};
