import { describe, it, expect } from 'vitest';
import { HealthController } from '../src/modules/health/health.controller.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

describe('HealthController', () => {
  const prismaMock = { isConnected: false } as PrismaService;
  const controller = new HealthController(prismaMock);

  it('returns valid liveness payload', () => {
    const res = controller.liveness();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('DocTALK API');
    expect(res.version).toBe('0.1.0');
    expect(res.timestamp).toBeDefined();
  });

  it('returns valid readiness payload with provider adapters status', async () => {
    const res = await controller.readiness();
    expect(res.status).toBe('ready');
    expect(res.providers).toBeDefined();
    expect(res.featureFlags).toBeDefined();
  });
});
