const gatewayUrl = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:4000';

export async function login(username, password) {
  const response = await fetch(`${gatewayUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? 'Login failed.');
  }

  return body;
}

export async function graphqlRequest(token, query, variables = {}) {
  const response = await fetch(`${gatewayUrl}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const body = await response.json();

  if (!response.ok || body.errors) {
    const message = body.errors?.[0]?.message ?? body.error ?? 'GraphQL request failed.';
    throw new Error(message);
  }

  return body.data;
}

export async function runDiagnostic(token, serviceId) {
  const response = await fetch(
    `${gatewayUrl}/api/diagnostics/${encodeURIComponent(serviceId)}`,
    {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
  );

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? 'Diagnostic failed.');
  }

  return body;
}
