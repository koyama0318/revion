import type { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import type { DomainEvent, DomainEventPayload } from '../types/event'

// export interface EventHandler {
//   handle(event: DomainEvent<DomainEventPayload>): Promise<void>
// }

export type HandleEventFn = (
  event: DomainEvent<DomainEventPayload>
) => ResultAsync<void, AppError>
