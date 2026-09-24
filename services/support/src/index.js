import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { expressMiddleware } from '@as-integrations/express5';
import { typeDefs, resolvers } from './schema.js';
import { runDiagnostic } from './diagnostics.js';

const port = Number(process.env.PORT ?? 4002);
const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }]),
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

await server.start();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'support' });
});

app.get('/api/diagnostics/:serviceId', (req, res) => {
  const result = runDiagnostic(req.params.serviceId);

  if (!result) {
    return res.status(404).json({ error: 'Unknown service.' });
  }

  return res.json(result);
});

app.use('/graphql', expressMiddleware(server));

await new Promise((resolve) => httpServer.listen({ port }, resolve));
console.log(`Support subgraph ready at http://localhost:${port}/graphql`);
