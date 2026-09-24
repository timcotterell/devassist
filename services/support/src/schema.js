import gql from 'graphql-tag';
import { incidents, runbooks } from './data.js';
import { runDiagnostic } from './diagnostics.js';

export const typeDefs = gql`
  enum IncidentSeverity {
    SEV_1
    SEV_2
    SEV_3
    SEV_4
  }

  enum IncidentStatus {
    INVESTIGATING
    MONITORING
    RESOLVED
  }

  type Incident {
    id: ID!
    title: String!
    severity: IncidentSeverity!
    status: IncidentStatus!
    createdAt: String!
  }

  type Runbook {
    id: ID!
    title: String!
    description: String!
  }

  type DiagnosticCheck {
    id: ID!
    name: String!
    status: String!
    detail: String!
  }

  type DiagnosticResult {
    serviceId: ID!
    status: String!
    executedAt: String!
    summary: String!
    checks: [DiagnosticCheck!]!
  }

  type Service @key(fields: "id") {
    id: ID!
    incidents: [Incident!]!
    runbooks: [Runbook!]!
  }

  type Query {
    incidents: [Incident!]!
    runbooks: [Runbook!]!
  }

  type Mutation {
    runDiagnostic(serviceId: ID!): DiagnosticResult
  }
`;

export const resolvers = {
  Query: {
    incidents: () => incidents,
    runbooks: () => runbooks
  },
  Mutation: {
    runDiagnostic: (_, { serviceId }) => runDiagnostic(serviceId)
  },
  Service: {
    incidents(service) {
      return incidents.filter((incident) => incident.serviceId === service.id);
    },
    runbooks(service) {
      return runbooks.filter((runbook) => runbook.serviceIds.includes(service.id));
    }
  }
};
