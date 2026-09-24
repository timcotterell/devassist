import http from 'node:http';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs, resolvers } from './schema.js';
import { runDiagnostic } from './diagnostics.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 4002);
const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use(
  pinoHttp({
    logger,

    genReqId(req, res) {
      const existingId = req.headers['x-request-id'];

      const requestId =
        typeof existingId === 'string'
          ? existingId
          : crypto.randomUUID();

      res.setHeader('x-request-id', requestId);

      return requestId;
    },

    customProps(req) {
      return {
        requestId: req.id
      };
    }
  })
);

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

await server.start();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'support' });
});

app.get('/api/diagnostics/:serviceId', (req, res) => {
  req.log.info(
    {
      serviceId: req.params.serviceId
    },
    'Diagnostic execution started'
  );

  const result = runDiagnostic(req.params.serviceId);

  if (!result) {
    req.log.warn(
      {
        serviceId: req.params.serviceId
      },
      'Diagnostic requested for unknown service'
    );

    return res.status(404).json({ error: 'Unknown service.' });
  }

  req.log.info(
    {
      serviceId: req.params.serviceId,
      diagnosticStatus: result.status
    },
    'Diagnostic execution completed'
  );

  return res.json(result);
});

app.use('/graphql', expressMiddleware(server));

await new Promise((resolve) => httpServer.listen({ port }, resolve));

logger.info(
  {
    port,
    graphqlUrl: `http://localhost:${port}/graphql`
  },
  'Support service started'
);
