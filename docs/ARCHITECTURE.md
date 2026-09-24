# DevAssist Architecture

## Goal

Provide a compact example of a developer-support platform that turns scattered service context into a unified support experience.

The architecture deliberately separates **service catalog data** from **support data** to demonstrate federated ownership. The gateway composes both domains while preserving independent service boundaries.

## Components

### Catalog subgraph

Owns:

- service identity
- owner
- tier
- endpoint
- reported health
- service dependencies

It defines `Service` as a federated entity using `@key(fields: "id")`.

### Support subgraph

Owns:

- incidents
- runbooks
- deterministic diagnostics

It contributes `incidents` and `runbooks` to the federated `Service` entity.

The service also exposes a REST diagnostic route. This demonstrates a realistic environment where GraphQL and REST coexist rather than forcing every operational action into one protocol.

### Gateway

The gateway provides the public backend surface.

Responsibilities:

- compose the two GraphQL subgraphs
- issue and verify JWTs for the local demo
- protect the federated GraphQL endpoint
- expose a protected REST diagnostic route
- isolate clients from internal service locations

### React console

The React UI:

- authenticates through the gateway
- requests a federated service view
- displays dependency, incident, and runbook context
- launches on-demand diagnostics through REST

### MCP server

The MCP server is intentionally a separate process using stdio.

It exposes safe read/diagnostic operations to MCP hosts:

- list services
- inspect a service
- execute a deterministic diagnostic

The MCP server calls the same gateway used by the human-facing UI. This keeps agent access on the same application boundary rather than creating an alternate privileged path.

## Federation flow

A dashboard request such as:

```graphql
query {
  services {
    id
    name
    incidents { title }
    runbooks { title }
  }
}
```

is split by the gateway:

1. Fetch service identities and catalog fields from the catalog subgraph.
2. Use each service `id` as its federated representation.
3. Resolve support-owned fields from the support subgraph.
4. Return one response to the caller.

This demonstrates the purpose of a federated graph: teams can own their domain independently while consumers interact with a unified API.

## Diagnostic model

The MVP diagnostic engine is deterministic and intentionally safe. It does not execute arbitrary shell commands.

Checks currently model:

- DNS registration
- HTTP reachability
- authentication configuration
- dependency health

A production implementation would use a plug-in model with allow-listed diagnostic actions, scoped credentials, timeouts, audit logging, and policy enforcement.

## Security choices

The MVP has deliberately simple authentication so the architecture remains easy to run locally.

Production changes would include:

- external OIDC identity provider
- asymmetric token signing
- token rotation
- RBAC/ABAC
- TLS between services
- service-to-service authentication
- secret management
- audit logs
- input validation at every boundary
- rate limiting
- CSRF and browser security hardening where applicable

The hard-coded local demo user is not intended as a security pattern.

## Design decisions worth discussing in an interview

### Why GraphQL federation?

Support tooling often needs data from multiple owners: service catalog, incidents, deployments, observability, runbooks, and ownership. Federation allows those domains to evolve independently while exposing a coherent model.

### Why keep REST?

Diagnostics are actions and may eventually support streaming/progress semantics. Keeping a REST action beside GraphQL also demonstrates protocol pragmatism rather than using GraphQL indiscriminately.

### Why MCP through the gateway?

AI tooling should not receive a hidden privileged integration path. Reusing the gateway preserves the same authentication and application boundary as other clients.

### Why deterministic diagnostics?

An AI model may recommend a diagnostic, but the action itself should be explicit, allow-listed, and auditable. This MVP keeps execution deterministic and safe.
