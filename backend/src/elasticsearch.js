import { Client } from '@elastic/elasticsearch';
import 'dotenv/config';

const client = new Client({
  node: `http://${process.env.ELASTICSEARCH_HOST}:${process.env.ELASTICSEARCH_PORT}`
});

client.ping()
  .then(() => console.log('Conectado ao Elasticsearch com sucesso!'))
  .catch(error => console.error('Falha ao conectar com o Elasticsearch:', error));

export default client;
