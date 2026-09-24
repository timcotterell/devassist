# DevAssist

DevAssist is a developer-support automation platform designed to reduce the amount of manual context gathering required when troubleshooting application and service issues.

It combines service ownership, dependency information, incidents, runbooks, deterministic diagnostics, structured logging, distributed tracing, and AI-tool integration behind a common application boundary.

The project was built as a practical exploration of developer productivity, support engineering, federated GraphQL, observability, and safe automation.

---

## Why DevAssist?

A support engineer investigating an application problem often has to answer several questions before meaningful troubleshooting can begin:

- Who owns this service?
- What does it depend on?
- Is there an active incident?
- Is a runbook available?
- Is the service reachable?
- Are its dependencies healthy?
- Is authentication configured correctly?
- Where did a request fail across multiple services?

DevAssist brings those signals together into one support-focused interface.

Instead of replacing engineering judgment, the platform is designed to make the information required for that judgment faster and easier to obtain.

---

## Features

### Service Catalog

DevAssist maintains service metadata including:

- Service name
- Ownership
- Tier
- Health
- Endpoint
- Dependencies

The Catalog domain is exposed through its own Apollo Federation subgraph.

### Support Context

The Support domain provides:

- Active incidents
- Incident severity and status
- Troubleshooting runbooks
- Diagnostic execution

Support information is exposed through a separate federated GraphQL subgraph.

### Deterministic Diagnostics

DevAssist includes safe, deterministic diagnostic checks rather than arbitrary remote shell execution.

Current checks include:

- DNS registration
- HTTP reachability
- Authentication configuration
- Dependency health

Diagnostic execution is also available through a REST API.

### Federated GraphQL

DevAssist uses Apollo Federation to separate service catalog and support concerns while presenting clients with a unified GraphQL API.

Current subgraphs:

- `catalog`
- `support`

The Gateway composes those subgraphs into a single graph.

### REST API

Operational actions such as diagnostics are exposed through REST endpoints.

This intentionally separates action-oriented operations from GraphQL data retrieval.

### JWT Authentication

The Gateway protects application APIs using JWT authentication.

The current local environment uses demo credentials for development purposes.

### MCP Integration

DevAssist includes a Model Context Protocol server that exposes selected support functionality to compatible AI tooling.

Current MCP tools include:

- `list-services`
- `get-service`
- `run-diagnostic`

The MCP server uses the DevAssist Gateway rather than bypassing application boundaries, allowing the same authorization and service interfaces to remain in effect.

### Structured Logging

Backend services use Pino for structured application and HTTP logging.

Each request receives a unique `x-request-id` that is propagated across service boundaries.

This allows a request to be correlated across:

- Gateway
- Catalog
- Support
- Diagnostic operations

Sensitive values such as authorization tokens and cookies are redacted from logs.

### Distributed Tracing

DevAssist uses OpenTelemetry with W3C Trace Context propagation.

Trace context is propagated across both:

- Apollo Federation GraphQL requests
- Gateway-to-Support REST diagnostic requests

Individual services are represented independently in the trace:

- `devassist-gateway`
- `devassist-catalog`
- `devassist-support`

A federated GraphQL request can therefore be visualized as:

```text
                 +-------------------+
                 | Catalog Subgraph  |
                 +---------+---------+
                           ^
                           |
+---------+       +--------+--------+
| Browser | ----> |     Gateway     |
+---------+       +--------+--------+
                           |
                           v
                 +---------+---------+
                 | Support Subgraph  |
                 +-------------------+
```

A diagnostic request produces a trace such as:

```text
+---------+
| Gateway |
+----+----+
     |
     v
+----+----+
| Support |
+----+----+
     |
     v
+----------------+
| diagnostic.run |
+----------------+
```

This makes it possible to see request timing and service boundaries rather than relying only on individual log entries.

---

## Request IDs vs. Trace IDs

DevAssist deliberately maintains both application request IDs and OpenTelemetry trace IDs.

### Request ID

`x-request-id` is a simple application-level correlation identifier.

It is particularly useful when:

- Searching logs
- Following a support request manually
- Communicating an identifier between engineers
- Correlating events without an observability backend

### Trace ID

The OpenTelemetry trace ID represents distributed execution context.

It allows an observability platform to reconstruct:

- Parent-child span relationships
- Service boundaries
- Timing
- Latency
- Errors
- Span metadata

Using both mechanisms provides straightforward operational log correlation while retaining full distributed tracing capability.

---

## Architecture

```text
                              +------------------+
                              |     React UI     |
                              |      :5173       |
                              +---------+--------+
                                        |
                                        |
                                        v
                              +---------+--------+
                              |   Node Gateway   |
                              |      :4000       |
                              |                 |
                              | JWT / REST / GQL |
                              +----+--------+----+
                                   |        |
                      GraphQL      |        |      GraphQL
                                   |        |
                    +--------------+        +--------------+
                    |                                      |
                    v                                      v
          +---------+---------+                  +---------+---------+
          | Catalog Subgraph |                  | Support Subgraph |
          |      :4001       |                  |      :4002       |
          +-------------------+                  +---------+---------+
                                                            |
                                                            |
                                                            v
                                                   +--------+--------+
                                                   |   Diagnostics   |
                                                   +-----------------+

                              +-------------------+
                              |    MCP Server     |
                              +---------+---------+
                                        |
                                        |
                                        v
                                   Gateway APIs
```

The application is intentionally divided by responsibility.

The Catalog service owns information about services and dependencies.

The Support service owns incidents, runbooks, and diagnostic functionality.

The Gateway provides the external application boundary and composes the federated graph.

The MCP server consumes those same application interfaces rather than creating a privileged side channel.

---

## Technology Stack

### Backend

- Node.js
- JavaScript
- Express
- Apollo Server
- Apollo Gateway
- Apollo Federation
- GraphQL
- REST
- JSON Web Tokens
- Pino
- OpenTelemetry

### Frontend

- React
- Vite
- HTML
- CSS
- JavaScript

### Developer Tooling

- npm workspaces
- Git
- GitHub
- GitHub Actions
- Node.js test tooling

### AI Integration

- Model Context Protocol (MCP)

### Observability

- Pino structured logging
- Request correlation
- OpenTelemetry
- W3C Trace Context
- OTLP/HTTP
- Jaeger-compatible tracing

---

## Repository Structure

```text
devassist/
|
+-- services/
|   |
|   +-- gateway/
|   |   +-- src/
|   |       +-- index.js
|   |       +-- logger.js
|   |       +-- telemetry.js
|   |       +-- tracing.js
|   |
|   +-- catalog/
|   |   +-- src/
|   |       +-- index.js
|   |       +-- schema.js
|   |       +-- logger.js
|   |       +-- telemetry.js
|   |       +-- graphqlTracing.js
|   |
|   +-- support/
|       +-- src/
|           +-- index.js
|           +-- schema.js
|           +-- diagnostics.js
|           +-- logger.js
|           +-- telemetry.js
|           +-- tracing.js
|
+-- web/
|   +-- src/
|
+-- mcp/
|
+-- docs/
|   +-- ARCHITECTURE.md
|
+-- .github/
|
+-- .editorconfig
+-- .gitattributes
+-- package.json
+-- package-lock.json
+-- README.md
```

The exact contents of individual directories may evolve as the project grows.

---

## Requirements

For normal local development:

- Node.js 24 LTS
- npm

For local distributed-tracing visualization:

- Jaeger 2.x or another OTLP-compatible observability backend

Jaeger is optional and is not required for DevAssist itself to run.

---

## Getting Started

Clone the repository:

```bash
git clone https://github.com/timcotterell/devassist.git
cd devassist
```

Install dependencies:

```bash
npm install
```

Start the development environment:

```bash
npm run dev
```

The root development command starts the application components in dependency order.

Once startup is complete, open:

```text
http://localhost:5173
```

---

## Local Demo Credentials

The local demo environment uses:

```text
Username: developer
Password: demo-password
```

These credentials are intended only for local development and demonstration.

Production authentication would use an external identity provider and stronger key-management practices rather than embedded demonstration credentials.

---

## Local Ports

| Component | Port |
|---|---:|
| React UI | 5173 |
| Gateway | 4000 |
| Catalog Subgraph | 4001 |
| Support Subgraph | 4002 |
| Jaeger UI | 16686 |
| OTLP/HTTP | 4318 |

---

## Running Jaeger Locally

DevAssist exports OpenTelemetry traces over OTLP/HTTP.

By default, local tracing uses:

```text
http://localhost:4318/v1/traces
```

The Jaeger UI is normally available at:

```text
http://localhost:16686
```

Start a local Jaeger instance before starting DevAssist if trace visualization is desired.

Then:

```bash
npm run dev
```

Use the application normally and select:

```text
devassist-gateway
```

from the Jaeger service list.

Federated requests should contain spans from:

```text
devassist-gateway
devassist-catalog
devassist-support
```

Diagnostic traces should include:

```text
devassist-gateway
devassist-support
diagnostic.run
```

---

## OpenTelemetry Configuration

The default OTLP trace endpoint is:

```text
http://localhost:4318/v1/traces
```

It can be overridden with:

```text
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

For example:

```bash
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://telemetry-host:4318/v1/traces
```

Each backend service exports its own `service.name`.

This allows an observability platform to identify service boundaries while preserving shared distributed-trace context.

---

## Example Diagnostic Flow

When a user runs diagnostics for the Checkout API:

```text
React
   |
   v
Gateway
   |
   | x-request-id
   | traceparent
   |
   v
Support
   |
   v
diagnostic.run
   |
   +-- DNS registration
   +-- HTTP reachability
   +-- Authentication configuration
   +-- Dependency health
```

The current demonstration data intentionally produces an authentication-related failure for Checkout while allowing the other checks to succeed.

This makes degraded behavior visible without depending on an external production system.

---

## Example Federation Flow

The UI can request service information from one unified GraphQL API even though different domains own different parts of the data.

Conceptually:

```graphql
query {
  services {
    id
    name
    owner
    tier
    health
    dependencies {
      id
      name
      health
    }
    incidents {
      title
      severity
      status
    }
    runbooks {
      title
    }
  }
}
```

Apollo Gateway determines which subgraph owns each field and coordinates the downstream requests.

The client does not need to know which backend service owns the requested data.

---

## Security Design

DevAssist is a development and portfolio project, but several production-oriented security practices are intentionally represented.

### Authentication Boundary

External application access is routed through the Gateway.

### No Arbitrary Shell Diagnostics

The diagnostic engine uses predefined deterministic checks instead of accepting arbitrary shell commands.

This reduces the risk of turning a support tool into a remote execution mechanism.

### MCP Uses Existing Application Boundaries

MCP tooling communicates through DevAssist application interfaces rather than directly accessing internal service data.

### Sensitive Log Redaction

Authorization headers, cookies, and related sensitive values are redacted from structured logs.

For example:

```text
authorization: "[REDACTED]"
```

rather than storing bearer tokens.

### Environment-Based Configuration

Secrets and environment-specific settings should be provided through environment variables rather than committed source code.

The included local credentials are demonstration values only.

---

## Cross-Platform Development

DevAssist is designed to work consistently across:

- Windows
- macOS
- Linux

The repository includes `.gitattributes` to normalize source files to LF line endings:

```text
* text=auto eol=lf
```

Windows-native batch files may retain CRLF where appropriate.

An `.editorconfig` file also standardizes:

- UTF-8 encoding
- LF line endings
- Final newlines
- Trailing whitespace behavior

This prevents operating-system-specific line-ending changes from creating unnecessary Git diffs.

---

## Development Philosophy

DevAssist is built around several principles.

### Automate Repeated Support Work

If engineers repeatedly gather the same information before troubleshooting, that information should be easier to retrieve automatically.

### Preserve Human Judgment

Diagnostics should provide evidence and context rather than pretending to replace engineering analysis.

### Make Failure Observable

Troubleshooting becomes significantly easier when requests can be followed across service boundaries.

### Prefer Safe Automation

Support tooling should use bounded, auditable operations rather than unrestricted remote execution.

### Keep Service Boundaries Explicit

Catalog, support, diagnostics, and client interfaces are deliberately separated so the architecture can evolve without collapsing into one tightly coupled application.

### Use AI Through Controlled Interfaces

AI tooling can consume DevAssist capabilities through MCP while remaining behind the same application boundaries used by other clients.

---

## Testing

Run the available automated tests with:

```bash
npm test
```

Where applicable, individual workspace tests can also be run independently.

Before committing significant changes, the project should pass:

```bash
npm test
npm run build
git diff --check
```

---

## Production Considerations

DevAssist is currently a portfolio and development project rather than a production deployment.

A production implementation would likely introduce additional capabilities such as:

- Persistent database storage
- OAuth 2.0 / OpenID Connect
- External identity-provider integration
- Asymmetric JWT signing
- Fine-grained authorization
- Persistent incident integrations
- Metrics
- Centralized log aggregation
- Production OpenTelemetry Collector infrastructure
- Rate limiting
- Audit logging
- Secrets management
- Service-level objectives
- Deployment orchestration
- Expanded diagnostic providers

The current architecture is intended to provide clean boundaries for those capabilities to be added incrementally.

---

## Current Status

The current MVP includes:

- React developer-support interface
- Node.js Gateway
- JWT authentication
- Apollo Federation
- Catalog GraphQL subgraph
- Support GraphQL subgraph
- REST diagnostics
- Deterministic diagnostic engine
- Service dependencies
- Incidents
- Runbooks
- MCP integration
- Structured Pino logging
- Sensitive-log redaction
- Cross-service request correlation
- OpenTelemetry tracing
- W3C trace-context propagation
- Jaeger-compatible OTLP export
- Cross-platform line-ending normalization
- GitHub Actions
- Architecture documentation

---

## Future Work

Potential future improvements include:

- Persistent service and incident storage
- OAuth/OIDC authentication
- Role-based authorization
- OpenTelemetry metrics
- Log/trace correlation enhancements
- Diagnostic execution history
- Additional diagnostic providers
- Incident-system integrations
- Service ownership integrations
- More advanced dependency visualization
- Expanded MCP capabilities
- Streamable HTTP MCP transport
- Production-ready deployment configuration
- OpenTelemetry Collector support

---

## Design Notes

More detailed architectural information is available in:

```text
docs/ARCHITECTURE.md
```

---

## License

This project is provided as a portfolio and demonstration project.

See the repository license for applicable usage terms.
