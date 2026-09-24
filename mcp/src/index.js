import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { diagnostic, graphql } from './client.js';

const SERVICE_FIELDS = `
  id
  name
  owner
  tier
  health
  endpoint
  dependencies { id name health }
  incidents { id title severity status }
  runbooks { id title description }
`;

serveStdio(() => {
  const server = new McpServer({
    name: 'devassist',
    version: '0.1.0'
  });

  server.registerTool(
    'list-services',
    {
      description: 'List services visible in the DevAssist support catalog.',
      inputSchema: z.object({})
    },
    async () => {
      const data = await graphql(`
        query {
          services {
            id
            name
            owner
            tier
            health
          }
        }
      `);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data.services, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    'get-service',
    {
      description:
        'Get federated service details including dependencies, incidents, and runbooks.',
      inputSchema: z.object({
        serviceId: z.string().min(1)
      })
    },
    async ({ serviceId }) => {
      const data = await graphql(
        `
          query GetService($id: ID!) {
            service(id: $id) {
              ${SERVICE_FIELDS}
            }
          }
        `,
        { id: serviceId }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data.service, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    'run-diagnostic',
    {
      description:
        'Run the allow-listed deterministic diagnostic checks for a service.',
      inputSchema: z.object({
        serviceId: z.string().min(1)
      })
    },
    async ({ serviceId }) => {
      const result = await diagnostic(serviceId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  return server;
});
