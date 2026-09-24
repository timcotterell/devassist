# DevAssist

DevAssist is a portfolio-scale developer support automation platform built to demonstrate how a support engineering organization can combine self-service diagnostics, federated service metadata, runbooks, incident context, and AI-accessible tooling.

The MVP intentionally focuses on a small number of capabilities with a realistic architecture rather than a large number of shallow features.

## What the MVP demonstrates

- **Node.js** services using modern ESM JavaScript
- **Apollo Federation 2** with separate catalog and support subgraphs
- **GraphQL** composition through an Apollo Gateway
- **REST** diagnostics exposed through Express
- **React** support console built with Vite
- **JWT authentication** at the gateway
- **Automated support diagnostics** with deterministic checks
- **MCP server** exposing support tools to AI hosts
- **GitHub Actions** for automated test/build validation
- **Docker Compose** for local multi-service startup
- Unit tests around authentication and diagnostic logic

## Architecture

```text
                         +----------------------+
                         |      React UI        |
                         |       :5173          |
                         +----------+-----------+
                                    |
                              JWT + GraphQL/REST
                                    |
                         +----------v-----------+
                         |   Apollo Gateway     |
                         |   Express / :4000    |
                         +------+----------+----+
                                |          |
                         GraphQL|          |GraphQL
                                |          |
                 +--------------v--+    +--v----------------+
                 | Catalog Subgraph|    | Support Subgraph  |
                 |      :4001      |    | :4002 + REST API  |
                 +-----------------+    +---------+----------+
                                                  |
                                          Diagnostic engine
                                                  |
                         +------------------------v-----------+
                         | MCP server over stdio              |
                         | list / inspect / run diagnostics   |
                         +------------------------------------+
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design details.

## Demo credentials

The MVP ships with an intentionally simple local-only demo identity:

- Username: `developer`
- Password: `demo-password`

**Do not use the demo credentials or fallback JWT secret in a production deployment.**

## Prerequisites

- Node.js 24 LTS
- npm
- Optional: Docker / Docker Compose

## Local setup

From the repository root:

```bash
npm install
```

Start each service in a separate terminal:

```bash
npm run dev:catalog
npm run dev:support
npm run dev:gateway
npm run dev:web
```

Then open:

```text
http://localhost:5173
```

Log in with the demo credentials shown above.

## Useful endpoints

| Endpoint | Purpose |
|---|---|
| `http://localhost:4000/api/health` | Gateway health |
| `http://localhost:4000/graphql` | Federated GraphQL endpoint, JWT protected |
| `http://localhost:4000/api/diagnostics/:serviceId` | JWT-protected REST diagnostic proxy |
| `http://localhost:4001/graphql` | Catalog subgraph |
| `http://localhost:4002/graphql` | Support subgraph |
| `http://localhost:4002/api/diagnostics/:serviceId` | Internal diagnostic API |

## Example federated query

After obtaining a token from `POST /api/auth/login`, call the gateway:

```graphql
query SupportDashboard {
  services {
    id
    name
    owner
    tier
    health
    endpoint
    dependencies {
      id
      name
      health
    }
    incidents {
      id
      title
      severity
      status
    }
    runbooks {
      id
      title
      description
    }
  }
}
```

`Service` originates in the catalog subgraph while `incidents` and `runbooks` are resolved by the support subgraph. The gateway composes them into one graph.

## MCP

The MCP server exposes three tools:

- `list-services`
- `get-service`
- `run-diagnostic`

Start it with:

```bash
npm run dev:mcp
```

The server uses stdio so it can be registered with MCP-capable hosts. It authenticates to the DevAssist gateway using the demo credentials unless environment variables override them.

## Test

```bash
npm test
npm run build
```

## Docker

```bash
docker compose up --build
```

The React development server is intentionally not included in the initial compose file; the backend topology is the part most useful to demonstrate containerized service composition in the MVP. A production frontend container is on the roadmap.

## Roadmap after MVP

1. Persist services/incidents/runbooks in PostgreSQL
2. Replace demo auth with OIDC/OAuth 2.1
3. Add WebSocket/SSE diagnostic progress
4. Add OpenTelemetry traces and metrics
5. Add diagnostic plug-in registry
6. Add role-based access controls
7. Add MCP Streamable HTTP transport and machine auth
8. Add integration tests for the full federated graph
9. Add production React container and reverse proxy
10. Add live demo deployment

## Why DevAssist exists

Support engineers often spend time repeatedly collecting the same context before meaningful troubleshooting can begin. DevAssist explores a model where service ownership, dependency information, incident history, runbooks, and deterministic diagnostics are available through one support surface—and through the same APIs that AI-assisted developer tools can consume.
