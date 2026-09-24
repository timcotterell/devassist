import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
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
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = createToken(demoUser);

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
    const response = await fetch(
      `${supportBaseUrl}/api/diagnostics/${encodeURIComponent(req.params.serviceId)}`
    );

    const body = await response.json();
    return res.status(response.status).json(body);
  } catch (error) {
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
  })
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
    context: async ({ req }) => ({ user: req.user })
  })
);

await new Promise((resolve) => httpServer.listen({ port }, resolve));
console.log(`Gateway ready at http://localhost:${port}/graphql`);
