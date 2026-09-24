import jwt from 'jsonwebtoken';

const fallbackSecret = 'devassist-local-only-secret';

export function getJwtSecret() {
  return process.env.JWT_SECRET ?? fallbackSecret;
}

export function createToken(user) {
  return jwt.sign(
    {
      sub: user.username,
      name: user.displayName,
      roles: user.roles
    },
    getJwtSecret(),
    {
      expiresIn: '1h',
      issuer: 'devassist-gateway',
      audience: 'devassist-clients'
    }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    issuer: 'devassist-gateway',
    audience: 'devassist-clients'
  });
}

export function parseBearerToken(headerValue = '') {
  const [scheme, token] = headerValue.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
