import jwt from 'jsonwebtoken';
import { query } from '../db.js';

export const authMiddleware = async (req, res, next) => {
    let token;

    // O token geralmente vem no formato "Bearer TOKEN"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrai o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifica e decodifica o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Busca o usuário no banco de dados usando o ID do token e anexa ao request
            // Evita anexar o hash da senha ao objeto req.user
            const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
            req.user = result.rows[0];

            if (!req.user) {
                 return res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
            }

            next(); // Passa para a próxima função (controller)
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, token não fornecido.' });
    }
};
