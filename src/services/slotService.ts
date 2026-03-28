import { InMemoryCache } from "../cache/inMemoryCache.js";

export interface CreateSlotInput {
  professional: string;
  startTime: number;
  endTime: number;
}

export interface Slot extends CreateSlotInput {
  id: number;
  createdAt: string;
}

export interface ListSlotsResult {
  slots: Slot[];
  cache: "hit" | "miss";
}

export const SLOT_LIST_CACHE_PREFIX = "slots:list";
export const SLOT_LIST_CACHE_KEY = `${SLOT_LIST_CACHE_PREFIX}:all`;
export const SLOT_LIST_CACHE_TTL_MS = 30_000;

export class SlotValidationError extends Error {
  readonly statusCode = 400;
}

export class SlotService {
  private readonly cache: InMemoryCache<Slot[]>;
  private readonly now: () => Date;
  private slots: Slot[] = [];
  private nextId = 1;

  constructor(
    cache = new InMemoryCache<Slot[]>({ ttlMs: SLOT_LIST_CACHE_TTL_MS, maxEntries: 10 }),
    now: () => Date = () => new Date(),
  ) {
    this.cache = cache;
    this.now = now;
  }

  async listSlots(): Promise<ListSlotsResult> {
    const result = await this.cache.getOrLoad(SLOT_LIST_CACHE_KEY, () => this.buildSnapshot());

    return {
      slots: this.cloneSlots(result.value),
      cache: result.source === "cache" ? "hit" : "miss",
    };
  }

  createSlot(input: CreateSlotInput): Slot {
    this.assertValidInput(input);

    const slot: Slot = {
      id: this.nextId,
      professional: input.professional.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      createdAt: this.now().toISOString(),
    };

    this.nextId += 1;
    this.slots.push(slot);
    this.cache.invalidateByPrefix(SLOT_LIST_CACHE_PREFIX);

    return { ...slot };
  }

  reset(): void {
    this.slots = [];
    this.nextId = 1;
    this.cache.clear();
  }

  private assertValidInput(input: CreateSlotInput): void {
    if (typeof input.professional !== "string" || input.professional.trim().length === 0) {
      throw new SlotValidationError("professional must be a non-empty string");
    }

    if (!Number.isFinite(input.startTime) || !Number.isFinite(input.endTime)) {
      throw new SlotValidationError("startTime and endTime must be finite numbers");
    }

    if (input.endTime <= input.startTime) {
      throw new SlotValidationError("endTime must be greater than startTime");
    }
  }

  private buildSnapshot(): Slot[] {
    return this.cloneSlots(this.slots);
  }

  private cloneSlots(slots: Slot[]): Slot[] {
    return slots.map((slot) => ({ ...slot }));
  }
}

export const slotService = new SlotService();