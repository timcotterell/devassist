import crypto from 'node:crypto';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs, resolvers } from './schema.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 4001);

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

const { url } = await startStandaloneServer(server, {
  listen: { port },

  context: async ({ req }) => {
    const existingId = req.headers['x-request-id'];

    const requestId =
      typeof existingId === 'string'
        ? existingId
        : crypto.randomUUID();

    logger.info(
      {
        requestId
      },
      'GraphQL request received'
    );

    return {
      requestId
    };
  }
});

logger.info(
  {
    port,
    graphqlUrl: url
  },
  'Catalog service started'
);
