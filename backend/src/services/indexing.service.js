import esClient from '../elasticsearch.js';
import * as providerRepo from '../repositories/provider.repository.js';
import * as serviceRepo from '../repositories/service.repository.js';

const INDEX_NAME = 'services';

// Função para garantir que o índice existe com o mapeamento correto
export const ensureIndexExists = async () => {
    const { body: exists } = await esClient.indices.exists({ index: INDEX_NAME });
    if (!exists) {
        await esClient.indices.create({
            index: INDEX_NAME,
            body: {
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        title: { type: 'text' },
                        description: { type: 'text' },
                        provider_id: { type: 'keyword' },
                        provider_name: { type: 'text' },
                        service_type_id: { type: 'keyword' },
                        service_type_name: { type: 'keyword' },
                        city: { type: 'keyword' },
                        neighborhood: { type: 'keyword' }
                    }
                }
            }
        });
        console.log(`Índice '${INDEX_NAME}' criado.`);
    }
};

// Indexa ou atualiza um único serviço
export const indexService = async (serviceId) => {
    try {
        const service = await serviceRepo.findById(serviceId);
        if (!service) return;

        const provider = await providerRepo.findById(service.provider_id);
        const serviceType = (await serviceRepo.findAllTypes()).find(st => st.id === service.service_type_id);

        const doc = {
            id: service.id,
            title: service.title,
            description: service.description,
            provider_id: provider.id,
            provider_name: (await providerRepo.findUserByProviderId(provider.id)).name,
            service_type_id: service.service_type_id,
            service_type_name: serviceType.name,
            city: provider.city,
            neighborhood: provider.neighborhood,
        };

        await esClient.index({
            index: INDEX_NAME,
            id: service.id,
            body: doc,
            refresh: true, 
        });
        console.log(`Serviço ${service.id} indexado.`);
    } catch (error) {
        console.error(`Erro ao indexar serviço ${serviceId}:`, error);
    }
};

// Remove um serviço do índice
export const deleteServiceFromIndex = async (serviceId) => {
    try {
        await esClient.delete({
            index: INDEX_NAME,
            id: serviceId,
            refresh: true,
        });
        console.log(`Serviço ${serviceId} removido do índice.`);
    } catch (error) {
        if (error.meta.statusCode !== 404) {
            console.error(`Erro ao remover serviço ${serviceId} do índice:`, error);
        }
    }
};
