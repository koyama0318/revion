import { v4 as uuidv4 } from 'uuid'

/**
 * Generates a UUID (v4).
 * @returns A new UUID string.
 */
export function generateUuid(): string {
  return uuidv4()
}
