import './telemetry.js';

import crypto from 'node:crypto';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs, resolvers } from './schema.js';
import { logger } from './logger.js';

import {
  graphqlTracingPlugin,
  startGraphQLSpan
} from './graphqlTracing.js';

const port = Number(
  process.env.PORT ?? 4001
);

const server = new ApolloServer({
  schema: buildSubgraphSchema([
    {
      typeDefs,
      resolvers
    }
  ]),

  plugins: [
    graphqlTracingPlugin
  ]
});

const { url } =
  await startStandaloneServer(
    server,
    {
      listen: {
        port
      },

      context: async ({
        req,
        res
      }) => {
        const existingId =
          req.headers[
            'x-request-id'
          ];

        const requestId =
          typeof existingId ===
          'string'
            ? existingId
            : crypto.randomUUID();

        const otelSpan =
          startGraphQLSpan(
            req,
            requestId
          );

        const traceId =
          otelSpan
            .spanContext()
            .traceId;

        res.setHeader(
          'x-trace-id',
          traceId
        );

        logger.info(
          {
            requestId,
            traceId
          },
          'GraphQL request received'
        );

        return {
          requestId,
          traceId,
          otelSpan
        };
      }
    }
  );

logger.info(
  {
    port,
    graphqlUrl: url
  },
  'Catalog service started'
);
