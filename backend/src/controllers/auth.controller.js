import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool, { query } from '../db.js';

// Função para Registrar um novo usuário
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Todos os campos são obrigatórios." });
  }
  if (role !== 'client' && role !== 'provider') {
    return res.status(400).json({ message: "O role deve ser 'client' ou 'provider'." });
  }

  const client = await pool.connect(); // Pega uma conexão do pool

  try {
    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rowCount > 0) {
      return res.status(409).json({ message: "Este e-mail já está em uso." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await client.query('BEGIN');

    const newUserQuery = `INSERT INTO users(name, email, password_hash, role) VALUES($1, $2, $3, $4) RETURNING id, name, email, role`;
    const newUserResult = await client.query(newUserQuery, [name, email, passwordHash, role]);
    const newUser = newUserResult.rows[0];

    if (role === 'provider') {
      const newProviderQuery = `INSERT INTO providers(user_id) VALUES($1)`;
      await client.query(newProviderQuery, [newUser.id]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: newUser
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no registro:', error);
    res.status(500).json({ message: "Erro interno do servidor ao registrar usuário." });
  } finally {
    client.release();
  }
};

// Função para Logar um usuário
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "E-mail e senha são obrigatórios." });
    }

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const payload = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login bem-sucedido!",
            token: `Bearer ${token}`,
            user: payload
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: "Erro interno do servidor ao tentar logar." });
    }
};
