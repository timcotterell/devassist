export const services = [
  {
    id: 'checkout-api',
    name: 'Checkout API',
    owner: 'Commerce Platform',
    tier: 'TIER_1',
    health: 'DEGRADED',
    endpoint: 'https://checkout.internal.example',
    dependencyIds: ['identity-api', 'pricing-api']
  },
  {
    id: 'identity-api',
    name: 'Identity API',
    owner: 'Identity Platform',
    tier: 'TIER_1',
    health: 'HEALTHY',
    endpoint: 'https://identity.internal.example',
    dependencyIds: []
  },
  {
    id: 'pricing-api',
    name: 'Pricing API',
    owner: 'Commerce Platform',
    tier: 'TIER_2',
    health: 'HEALTHY',
    endpoint: 'https://pricing.internal.example',
    dependencyIds: []
  }
];

export function findService(id) {
  return services.find((service) => service.id === id);
}
