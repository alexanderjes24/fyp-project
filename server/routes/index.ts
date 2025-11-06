import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function routes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Example test route
  fastify.get('/test', async (request, reply) => {
    return { message: 'TherapyMind routes working ✅' };
  });
}
