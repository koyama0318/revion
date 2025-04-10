import type { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'

/**
 * Represents a repository for accessing read models.
 * @template T The type of the read model.
 */
export interface ReadModelRepository<T> {
  /**
   * Finds a read model by its ID.
   * @param id - The ID of the read model to find.
   * @returns A ResultAsync containing the read model on success, or an AppError on failure.
   */
  findById(id: string): ResultAsync<T | null, AppError>

  /**
   * Finds all read models that match the given criteria.
   * @param criteria - The criteria to match.
   * @returns A ResultAsync containing an array of read models on success, or an AppError on failure.
   */
  findAll(criteria?: unknown): ResultAsync<T[], AppError>

  /**
   * Saves a read model.
   * @param model - The read model to save.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  save(model: T): ResultAsync<void, AppError>

  /**
   * Deletes a read model by its ID.
   * @param id - The ID of the read model to delete.
   * @returns A ResultAsync containing void on success, or an AppError on failure.
   */
  delete(id: string): ResultAsync<void, AppError>
}
