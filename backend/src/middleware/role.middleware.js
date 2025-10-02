/**
 * Middleware para verificar se o usuário possui uma das roles permitidas.
 * @param {string[]} allowedRoles - Um array de roles permitidas (ex: ['provider', 'admin']).
 */
export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Acesso negado. Role não especificada.' });
        }

        const { role } = req.user;

        if (allowedRoles.includes(role)) {
            next(); // O usuário tem a role permitida, continua para a próxima função
        } else {
            return res.status(403).json({ message: 'Acesso negado. Permissões insuficientes.' });
        }
    };
};

