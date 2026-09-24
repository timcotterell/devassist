# Contributing

DevAssist is currently a portfolio project, but it follows a normal pull-request workflow.

## Development rules

- Keep diagnostics deterministic and allow-listed.
- Do not add arbitrary shell execution.
- Add tests for new diagnostic rules and authentication behavior.
- Prefer small, reviewable pull requests.
- Document architectural decisions that materially change service boundaries.
- Never commit real credentials or production endpoints.

## Commit style

Use concise imperative commit messages, for example:

```text
Add dependency diagnostic rule
Protect gateway GraphQL endpoint
Expose service runbooks through federation
```
