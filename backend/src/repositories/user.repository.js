import { query } from '../db.js';

/**
 * Encontra um usuário pelo seu endereço de e-mail.
 * @param {string} email - O e-mail do usuário a ser encontrado.
 * @returns {Promise<object|undefined>} O objeto do usuário ou undefined se não for encontrado.
 */
export const findByEmail = async (email) => {
    const text = 'SELECT * FROM users WHERE email = $1';
    const values = [email];
    const result = await query(text, values);
    return result.rows[0];
};

/**
 * Encontra um usuário pelo seu ID.
 * @param {string} id - O UUID do usuário.
 * @returns {Promise<object|undefined>} O objeto do usuário (sem o hash da senha) ou undefined.
 */
export const findById = async (id) => {
    const text = 'SELECT id, name, email, role FROM users WHERE id = $1';
    const values = [id];
    const result = await query(text, values);
    return result.rows[0];
};

/**
 * Cria um novo usuário no banco de dados.
 * @param {object} userData - Os dados do usuário (name, email, passwordHash, role).
 * @param {object} client - O cliente de banco de dados para usar em uma transação.
 * @returns {Promise<object>} O novo usuário criado.
 */
export const create = async (userData, client) => {
    const { name, email, passwordHash, role } = userData;
    const text = `
        INSERT INTO users(name, email, password_hash, role) 
        VALUES($1, $2, $3, $4) 
        RETURNING id, name, email, role
    `;
    const values = [name, email, passwordHash, role];
    
    const dbClient = client || query;
    const result = await dbClient(text, values);
    return result.rows[0];
};
