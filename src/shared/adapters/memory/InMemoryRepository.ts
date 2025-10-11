/**
 * In-memory repository implementation.
 * Note
 */

import type {
  Repository,
  Entity,
  RepositoryQueryParams,
} from '../../contracts/repos';
import { EntityNotFoundError, ConcurrencyError } from '../../contracts/repos';

export class InMemoryRepository<T extends Entity> implements Repository<T> {
  private readonly store = new Map<string, T>();

  async getById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async upsert(entity: T): Promise<void> {
    const existing = this.store.get(entity.id);

    // Note
    if (existing && existing.version >= entity.version) {
      throw new ConcurrencyError(
        'TestEntity',
        entity.id,
        entity.version,
        existing.version
      );
    }

    const updatedEntity = {
      ...entity,
      version: entity.version + 1,
      updatedAt: new Date(),
    } as T;

    this.store.set(entity.id, updatedEntity);
  }

  async list(params?: RepositoryQueryParams): Promise<T[]> {
    let results = Array.from(this.store.values());

    // Filter
    if (params?.filters) {
      results = results.filter(entity =>
        Object.entries(params.filters!).every(
          ([key, value]) => (entity as any)[key] === value
        )
      );
    }

    // Sort
    if (params?.sortBy) {
      results.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!];
        const bVal = (b as any)[params.sortBy!];
        const order = params.sortOrder === 'desc' ? -1 : 1;

        if (aVal < bVal) return -order;
        if (aVal > bVal) return order;
        return 0;
      });
    }

    // Pagination
    if (params?.offset || params?.limit) {
      const start = params.offset ?? 0;
      const end = params.limit ? start + params.limit : undefined;
      results = results.slice(start, end);
    }

    return results;
  }

  async remove(id: string): Promise<void> {
    if (!this.store.has(id)) {
      throw new EntityNotFoundError('Entity', id);
    }
    this.store.delete(id);
  }

  async count(
    params?: Omit<RepositoryQueryParams, 'limit' | 'offset'>
  ): Promise<number> {
    const filteredResults = await this.list({
      ...params,
      limit: undefined,
      offset: undefined,
    });
    return filteredResults.length;
  }

  // Test helpers
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
