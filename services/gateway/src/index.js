import './telemetry.js';

import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from './logger.js';

import {
  currentTraceHeaders,
  tracingMiddleware
} from './tracing.js';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import {
  ApolloGateway,
  IntrospectAndCompose,
  RemoteGraphQLDataSource
} from '@apollo/gateway';
import { expressMiddleware } from '@as-integrations/express5';
import {
  createToken,
  parseBearerToken,
  verifyToken
} from './auth.js';

const port = Number(process.env.PORT ?? 4000);
const catalogUrl = process.env.CATALOG_URL ?? 'http://localhost:4001/graphql';
const supportUrl = process.env.SUPPORT_URL ?? 'http://localhost:4002/graphql';
const supportBaseUrl = new URL(supportUrl).origin;

const demoUser = {
  username: process.env.DEVASSIST_USER ?? 'developer',
  password: process.env.DEVASSIST_PASSWORD ?? 'demo-password',
  displayName: 'DevAssist Developer',
  roles: ['support-engineer']
};

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

app.use(tracingMiddleware);

function requireAuth(req, res, next) {
  try {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ error: 'Bearer token required.' });
    }

    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};

  if (username !== demoUser.username || password !== demoUser.password) {
    req.log.warn(
      {
        username
      },
      'Authentication failed'
    );

    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = createToken(demoUser);

  req.log.info(
    {
      user: demoUser.username
    },
    'User authenticated'
  );

  return res.json({
    token,
    user: {
      username: demoUser.username,
      displayName: demoUser.displayName,
      roles: demoUser.roles
    }
  });
});

app.get('/api/diagnostics/:serviceId', requireAuth, async (req, res) => {
  try {
    req.log.info(
      {
        serviceId: req.params.serviceId,
        traceId: req.traceId
      },
      'Running service diagnostic'
    );

    const response = await fetch(
      `${supportBaseUrl}/api/diagnostics/${encodeURIComponent(req.params.serviceId)}`,
      {
        headers: {
          'x-request-id': req.id,
          ...currentTraceHeaders()
        }
      }
    );

    const body = await response.json();

    req.log.info(
      {
        serviceId: req.params.serviceId,
        statusCode: response.status
      },
      'Support diagnostic response received'
    );

    return res.status(response.status).json(body);
  } catch (error) {
    req.log.error(
      {
        serviceId: req.params.serviceId,
        error: error.message
      },
      'Support service request failed'
    );

    return res.status(502).json({
      error: 'Support service unavailable.',
      detail: error.message
    });
  }
});

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'catalog', url: catalogUrl },
      { name: 'support', url: supportUrl }
    ]
  }),

  buildService({ url }) {
    return new RemoteGraphQLDataSource({
      url,

      willSendRequest({
        request,
        context
      }) {
        if (!request.http?.headers) {
          return;
        }

        if (context?.requestId) {
          request.http.headers.set(
            'x-request-id',
            context.requestId
          );
        }

        for (
          const [key, value]
          of Object.entries(
            context?.traceHeaders ?? {}
          )
        ) {
          request.http.headers.set(
            key,
            value
          );
        }
      }
    });
  }
});

const server = new ApolloServer({
  gateway,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

await server.start();

app.use(
  '/graphql',
  requireAuth,
  expressMiddleware(server, {
    context: async ({ req }) => ({
      user: req.user,
      requestId: req.id,
      traceHeaders: currentTraceHeaders()
    })
  })
);

await new Promise((resolve) => httpServer.listen({ port }, resolve));

logger.info(
  {
    port,
    graphqlUrl: `http://localhost:${port}/graphql`
  },
  'Gateway started'
);
