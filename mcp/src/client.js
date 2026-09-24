const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:4000';
const username = process.env.DEVASSIST_USER ?? 'developer';
const password = process.env.DEVASSIST_PASSWORD ?? 'demo-password';

let cachedToken;

async function getToken() {
  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch(`${gatewayUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error(`Gateway login failed with status ${response.status}.`);
  }

  const body = await response.json();
  cachedToken = body.token;
  return cachedToken;
}

export async function graphql(query, variables = {}) {
  const token = await getToken();

  let response = await fetch(`${gatewayUrl}/graphql`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  if (response.status === 401) {
    cachedToken = undefined;
    const refreshedToken = await getToken();

    response = await fetch(`${gatewayUrl}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${refreshedToken}`
      },
      body: JSON.stringify({ query, variables })
    });
  }

  const body = await response.json();

  if (!response.ok || body.errors) {
    throw new Error(body.errors?.[0]?.message ?? 'GraphQL request failed.');
  }

  return body.data;
}

export async function diagnostic(serviceId) {
  const token = await getToken();

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
    throw new Error(body.error ?? 'Diagnostic request failed.');
  }

  return body;
}
