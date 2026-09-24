import gql from 'graphql-tag';
import { services, findService } from './data.js';

export const typeDefs = gql`
  enum ServiceTier {
    TIER_1
    TIER_2
    TIER_3
  }

  enum HealthStatus {
    HEALTHY
    DEGRADED
    UNHEALTHY
    UNKNOWN
  }

  type Service @key(fields: "id") {
    id: ID!
    name: String!
    owner: String!
    tier: ServiceTier!
    health: HealthStatus!
    endpoint: String!
    dependencies: [Service!]!
  }

  type Query {
    services: [Service!]!
    service(id: ID!): Service
  }
`;

export const resolvers = {
  Query: {
    services: () => services,
    service: (_, { id }) => findService(id)
  },
  Service: {
    __resolveReference(reference) {
      return findService(reference.id);
    },
    dependencies(service) {
      return service.dependencyIds.map(findService).filter(Boolean);
    }
  }
};
