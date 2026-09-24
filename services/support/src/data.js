export const incidents = [
  {
    id: 'inc-1042',
    serviceId: 'checkout-api',
    title: 'Elevated authentication failures',
    severity: 'SEV_2',
    status: 'INVESTIGATING',
    createdAt: '2026-09-24T13:20:00Z'
  },
  {
    id: 'inc-1038',
    serviceId: 'pricing-api',
    title: 'Cache refresh latency',
    severity: 'SEV_3',
    status: 'RESOLVED',
    createdAt: '2026-09-23T18:05:00Z'
  }
];

export const runbooks = [
  {
    id: 'rb-auth',
    serviceIds: ['checkout-api', 'identity-api'],
    title: 'Authentication failure triage',
    description: 'Validate token configuration, identity reachability, and recent auth changes.'
  },
  {
    id: 'rb-dependency',
    serviceIds: ['checkout-api', 'pricing-api'],
    title: 'Dependency health investigation',
    description: 'Review dependency availability, latency, and recent deployment changes.'
  }
];

export const diagnosticProfiles = {
  'checkout-api': {
    dnsRegistered: true,
    httpReachable: true,
    authenticationConfigured: false,
    dependenciesHealthy: true
  },
  'identity-api': {
    dnsRegistered: true,
    httpReachable: true,
    authenticationConfigured: true,
    dependenciesHealthy: true
  },
  'pricing-api': {
    dnsRegistered: true,
    httpReachable: true,
    authenticationConfigured: true,
    dependenciesHealthy: true
  }
};
