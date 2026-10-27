import { describe, it, expect } from 'vitest';
import { HealthController } from '../src/modules/health/health.controller.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  it('returns valid liveness payload', () => {
    const prismaMock = { isConnected: false } as PrismaService;
    const controller = new HealthController(prismaMock);
    const res = controller.liveness();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('DocTALK API');
    expect(res.version).toBe('0.1.0');
    expect(res.timestamp).toBeDefined();
  });

  it('returns valid readiness payload when database is connected', async () => {
    const connectedPrisma = { isConnected: true } as PrismaService;
    const controller = new HealthController(connectedPrisma);
    const res = await controller.readiness();
    expect(res.status).toBe('ready');
    expect(res.database).toBe('connected');
    expect(res.providers).toBeDefined();
    expect(res.featureFlags).toBeDefined();
  });

  it('throws ServiceUnavailableException when database is disconnected', async () => {
    const disconnectedPrisma = { isConnected: false } as PrismaService;
    const controller = new HealthController(disconnectedPrisma);
    await expect(controller.readiness()).rejects.toThrow(ServiceUnavailableException);
  });
});
