import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs, resolvers } from './schema.js';

const port = Number(process.env.PORT ?? 4001);

const server = new ApolloServer({
  schema: buildSubgraphSchema([{ typeDefs, resolvers }])
});

const { url } = await startStandaloneServer(server, {
  listen: { port }
});

console.log(`Catalog subgraph ready at ${url}`);
