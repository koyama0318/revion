import { ResultAsync } from 'neverthrow'
import type { AppError } from '../types/app-error'
import { createInternalServerError } from '../types/app-error'
import type { Command, CommandResultAsync } from '../types/command'
import type { DomainEvent, DomainEventPayload } from '../types/domain-event'
import { logger } from '../utils/logger'

export interface SagaStep {
  readonly command: Command
  readonly compensation?: Command
}

export interface SagaDefinition {
  readonly steps: SagaStep[]
  readonly onSuccess?: () => Promise<void>
  readonly onFailure?: (error: AppError) => Promise<void>
}

export class SagaManager {
  constructor(
    private readonly dispatch: (command: Command) => CommandResultAsync
  ) {}

  async execute(saga: SagaDefinition): Promise<ResultAsync<void, AppError>> {
    logger.info('Starting saga execution', { steps: saga.steps.length })

    let currentStep = 0
    const executedSteps: SagaStep[] = []

    try {
      for (const step of saga.steps) {
        logger.debug('Executing saga step', {
          step: currentStep + 1,
          command: step.command
        })

        const result = await new Promise<ResultAsync<void, AppError>>(
          resolve => {
            this.dispatch(step.command).match(
              () =>
                resolve(
                  ResultAsync.fromPromise(
                    Promise.resolve(),
                    error => error as AppError
                  )
                ),
              error =>
                resolve(
                  ResultAsync.fromPromise(
                    Promise.reject(error),
                    error => error as AppError
                  )
                )
            )
          }
        )

        if (result.isErr()) {
          logger.error('Saga step failed', result.error, {
            step: currentStep + 1
          })
          return ResultAsync.fromPromise(
            this.compensate(executedSteps, saga.onFailure, result.error),
            error => error as AppError
          )
        }

        executedSteps.push(step)
        currentStep++
      }

      logger.info('Saga execution completed successfully')
      if (saga.onSuccess) {
        await saga.onSuccess()
      }

      return ResultAsync.fromPromise(
        Promise.resolve(),
        error => error as AppError
      )
    } catch (error) {
      logger.error('Unexpected error during saga execution', error as AppError)
      return ResultAsync.fromPromise(
        this.compensate(
          executedSteps,
          saga.onFailure,
          createInternalServerError('Unexpected error during saga execution', {
            cause: error
          })
        ),
        error => error as AppError
      )
    }
  }

  private async compensate(
    executedSteps: SagaStep[],
    onFailure?: (error: AppError) => Promise<void>,
    originalError?: AppError
  ): Promise<void> {
    logger.info('Starting saga compensation', { steps: executedSteps.length })

    for (const step of executedSteps.reverse()) {
      const compensation = step.compensation
      if (compensation) {
        logger.debug('Executing compensation step', {
          command: compensation
        })

        const result = await new Promise<ResultAsync<void, AppError>>(
          resolve => {
            this.dispatch(compensation).match(
              () =>
                resolve(
                  ResultAsync.fromPromise(
                    Promise.resolve(),
                    error => error as AppError
                  )
                ),
              error =>
                resolve(
                  ResultAsync.fromPromise(
                    Promise.reject(error),
                    error => error as AppError
                  )
                )
            )
          }
        )

        if (result.isErr()) {
          logger.error('Compensation step failed', result.error)
          // Continue with other compensations despite the error
        }
      }
    }

    if (onFailure) {
      await onFailure(
        originalError ||
          createInternalServerError('Unknown error during saga execution')
      )
    }
  }
}
