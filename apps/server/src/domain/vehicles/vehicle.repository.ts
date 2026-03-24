import type { VehicleRecord } from "@attra/shared";
import { readEnv } from "../../config/env.js";
import { createAutoConfClient, type AutoConfClient } from "../../integrations/stock/autoconf-client.js";
import { mapAutoConfToVehicle } from "../../integrations/stock/autoconf-mapper.js";
import { seedVehicles } from "../../integrations/stock/stock-fixtures.js";
import { logger } from "../../telemetry/logger.js";

export interface VehicleRepository {
  list(): Promise<VehicleRecord[]>;
  findById(vehicleId: string): Promise<VehicleRecord | null>;
  findManyByIds(vehicleIds: string[]): Promise<VehicleRecord[]>;
}

export class InMemoryVehicleRepository implements VehicleRepository {
  constructor(private readonly vehicles: VehicleRecord[]) {}

  async list(): Promise<VehicleRecord[]> {
    return this.vehicles;
  }

  async findById(vehicleId: string): Promise<VehicleRecord | null> {
    return this.vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
  }

  async findManyByIds(vehicleIds: string[]): Promise<VehicleRecord[]> {
    return this.vehicles.filter((vehicle) => vehicleIds.includes(vehicle.id));
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class AutoConfVehicleRepository implements VehicleRepository {
  private cache: VehicleRecord[] | null = null;
  private cacheTimestamp = 0;

  constructor(private readonly client: AutoConfClient) {}

  async list(): Promise<VehicleRecord[]> {
    return this.getVehicles();
  }

  async findById(vehicleId: string): Promise<VehicleRecord | null> {
    const vehicles = await this.getVehicles();
    return vehicles.find((v) => v.id === vehicleId) ?? null;
  }

  async findManyByIds(vehicleIds: string[]): Promise<VehicleRecord[]> {
    const vehicles = await this.getVehicles();
    return vehicles.filter((v) => vehicleIds.includes(v.id));
  }

  private async getVehicles(): Promise<VehicleRecord[]> {
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < CACHE_TTL_MS) {
      return this.cache;
    }

    try {
      const raw = await this.client.fetchAllVeiculos();
      this.cache = raw.map(mapAutoConfToVehicle);
      this.cacheTimestamp = now;
      logger.info(`[AutoConf] Loaded ${this.cache.length} vehicles from API`);
      return this.cache;
    } catch (err) {
      logger.error("[AutoConf] Failed to fetch vehicles", { error: err instanceof Error ? err.message : String(err) });
      // Fall back to cache if available, otherwise empty
      if (this.cache) return this.cache;
      return [];
    }
  }
}

function createVehicleRepository(): VehicleRepository {
  const env = readEnv();
  if (env.autoconfAuthToken && env.autoconfRevendaToken) {
    logger.info("[AutoConf] Using real AutoConf API for vehicle data");
    const client = createAutoConfClient(env);
    return new AutoConfVehicleRepository(client);
  }
  logger.info("[AutoConf] No credentials found, using seed fixtures");
  return new InMemoryVehicleRepository(seedVehicles);
}

export const vehicleRepository: VehicleRepository = createVehicleRepository();
