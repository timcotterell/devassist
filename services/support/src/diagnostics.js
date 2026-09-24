import { diagnosticProfiles } from './data.js';

const definitions = [
  {
    id: 'dns',
    name: 'DNS registration',
    evaluate: (profile) => profile.dnsRegistered,
    failure: 'Service hostname is not registered in the expected DNS view.'
  },
  {
    id: 'http',
    name: 'HTTP reachability',
    evaluate: (profile) => profile.httpReachable,
    failure: 'Service endpoint did not pass the reachability check.'
  },
  {
    id: 'auth',
    name: 'Authentication configuration',
    evaluate: (profile) => profile.authenticationConfigured,
    failure: 'Authentication configuration is incomplete or inconsistent.'
  },
  {
    id: 'dependencies',
    name: 'Dependency health',
    evaluate: (profile) => profile.dependenciesHealthy,
    failure: 'One or more required dependencies are unhealthy.'
  }
];

export function runDiagnostic(serviceId) {
  const profile = diagnosticProfiles[serviceId];

  if (!profile) {
    return null;
  }

  const checks = definitions.map((definition) => {
    const passed = Boolean(definition.evaluate(profile));
    return {
      id: definition.id,
      name: definition.name,
      status: passed ? 'PASS' : 'FAIL',
      detail: passed ? 'Check passed.' : definition.failure
    };
  });

  const failures = checks.filter((check) => check.status === 'FAIL');

  return {
    serviceId,
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    executedAt: new Date().toISOString(),
    checks,
    summary:
      failures.length === 0
        ? 'All deterministic diagnostics passed.'
        : `${failures.length} diagnostic check${failures.length === 1 ? '' : 's'} require attention.`
  };
}
