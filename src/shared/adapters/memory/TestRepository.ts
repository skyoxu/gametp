/**
 * Test-only repository implementation.
 * Implements IRepository for unit tests.
 */

import type { IRepository } from '../../contracts/ports';
import type { Entity, Id } from '../../contracts/ports';

export class TestRepository<TEntity extends Entity, TId = Id>
  implements IRepository<TEntity, TId>
{
  private readonly store = new Map<string, TEntity>();
  private idCounter = 1;

  async findById(id: TId): Promise<TEntity | null> {
    return this.store.get(String(id)) ?? null;
  }

  async findAll(): Promise<TEntity[]> {
    return Array.from(this.store.values());
  }

  async save(
    entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'> | TEntity
  ): Promise<TEntity> {
    const now = new Date().toISOString();

    // If the entity already has an ID, keep it; otherwise generate one
    const id =
      'id' in entity && entity.id
        ? (entity.id as TId)
        : (`test-${this.idCounter++}` as TId);

    const savedEntity = {
      ...entity,
      id,
      createdAt: ('createdAt' in entity && entity.createdAt) || now,
      updatedAt: now,
    } as TEntity;

    this.store.set(String(id), savedEntity);
    return savedEntity;
  }

  async update(id: TId, updates: Partial<TEntity>): Promise<TEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as TEntity;

    this.store.set(String(id), updated);
    return updated;
  }

  async delete(id: TId): Promise<boolean> {
    return this.store.delete(String(id));
  }

  async exists(id: TId): Promise<boolean> {
    return this.store.has(String(id));
  }

  // Test helpers
  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  // Allow setting ID manually for tests
  async saveWithId(entity: TEntity): Promise<TEntity> {
    const now = new Date().toISOString();
    const savedEntity = {
      ...entity,
      createdAt: entity.createdAt || now,
      updatedAt: now,
    } as TEntity;

    this.store.set(String(entity.id), savedEntity);
    return savedEntity;
  }
}
