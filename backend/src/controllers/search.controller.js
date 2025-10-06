import esClient from '../elasticsearch.js';

const INDEX_NAME = 'services';

export const searchServices = async (req, res) => {
    const { q, city, type } = req.query;

    try {
        const mustClauses = [];

        if (q) {
            mustClauses.push({
                multi_match: {
                    query: q,
                    fields: ['title', 'description', 'provider_name']
                }
            });
        }
        if (city) {
            mustClauses.push({
                match: {
                    city: {
                        query: city,
                        fuzziness: 'AUTO' // Permite pequenas variações no nome da cidade
                    }
                }
            });
        }
        if (type) {
            mustClauses.push({
                match: {
                    service_type_name: type
                }
            });
        }

        const { body } = await esClient.search({
            index: INDEX_NAME,
            body: {
                query: {
                    bool: {
                        must: mustClauses.length > 0 ? mustClauses : { match_all: {} }
                    }
                },
                aggs: {
                    service_types: {
                        terms: {
                            field: 'service_type_name',
                            size: 10
                        }
                    }
                }
            }
        });

        const results = body.hits.hits.map(hit => hit._source);
        const facets = body.aggregations.service_types.buckets.reduce((acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
        }, {});

        res.status(200).json({ results, facets });

    } catch (error) {
        console.error("Erro na busca do Elasticsearch:", error);
        res.status(500).json({ message: "Erro ao realizar a busca.", error: error.message });
    }
};
