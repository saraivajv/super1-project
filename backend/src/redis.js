import 'dotenv/config';
import { createClient } from 'redis';

const redisClient = createClient({
    url: `redis://${process.env.CACHE_HOST}:${process.env.CACHE_PORT}`
});

redisClient.on('error', (err) => console.error('Erro na Conexão com o Redis:', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Conectado ao Redis com sucesso!');
    } catch (err) {
        console.error('Falha ao conectar com o Redis:', err);
    }
})();

export default redisClient;
