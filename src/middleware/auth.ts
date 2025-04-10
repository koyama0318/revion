import { ResultAsync } from 'neverthrow'
import type { DispatchFn, MiddlewareFn } from '../command/command-bus'
import type { AppError } from '../types/app-error'
import { createPermissionDeniedError } from '../types/app-error'
import type { Command, CommandResultAsync } from '../types/command'
import { logger } from '../utils/logger'

/**
 * Represents a user context containing authentication and authorization information
 */
export interface UserContext {
  /** Unique identifier for the user */
  userId: string
  /** Authentication token or session id */
  authToken?: string
  /** User's roles for permission checking */
  roles: string[]
  /** Additional user attributes that might be relevant for authorization */
  attributes?: Record<string, unknown>
}

/**
 * Interface for authorization policies
 */
export interface AuthorizationPolicy {
  /**
   * Check if a command is authorized based on the user context
   * @param command - The command to authorize
   * @param userContext - The user context containing auth information
   * @returns A result indicating if the command is authorized
   */
  isAuthorized(
    command: Command,
    userContext: UserContext
  ): ResultAsync<boolean, AppError>
}

/**
 * Role-based authorization policy
 */
export class RoleBasedPolicy implements AuthorizationPolicy {
  private rolePermissions: Map<string, Set<string>> = new Map()

  /**
   * Create a new role-based policy
   * @param permissionsConfig - Map of roles to allowed operations
   */
  constructor(permissionsConfig: Record<string, string[]>) {
    // Initialize role permissions
    for (const [role, operations] of Object.entries(permissionsConfig)) {
      this.rolePermissions.set(role, new Set(operations))
    }
  }

  isAuthorized(
    command: Command,
    userContext: UserContext
  ): ResultAsync<boolean, AppError> {
    const { operation, aggregateType } = command
    const operationKey = `${aggregateType}:${operation}`

    // Check if any of the user's roles have permission for this operation
    const hasPermission = userContext.roles.some(role => {
      const allowedOperations = this.rolePermissions.get(role)
      return allowedOperations?.has(operationKey) || allowedOperations?.has('*')
    })

    return ResultAsync.fromPromise(
      Promise.resolve(hasPermission),
      error => error as AppError
    )
  }
}

/**
 * Get user context from the current request/environment
 * This is a placeholder - in a real implementation, this would get the user
 * context from an auth service, request headers, etc.
 */
export type GetUserContextFn = () => ResultAsync<UserContext, AppError>

/**
 * Create an authorization middleware for command processing
 * @param policy - The authorization policy to apply
 * @param getUserContext - Function to retrieve the current user context
 * @returns A middleware function that checks command authorization
 */
export function createAuthorizationMiddleware(
  policy: AuthorizationPolicy,
  getUserContext: GetUserContextFn
): MiddlewareFn {
  return (command: Command, next: DispatchFn): CommandResultAsync => {
    logger.debug('Authorizing command', {
      aggregateType: command.aggregateType,
      operation: command.operation
    })

    return getUserContext()
      .andThen(userContext => {
        return policy
          .isAuthorized(command, userContext)
          .andThen(isAuthorized => {
            if (!isAuthorized) {
              logger.warn('Authorization denied', {
                aggregateType: command.aggregateType,
                operation: command.operation,
                userId: userContext.userId,
                roles: userContext.roles
              })

              return ResultAsync.fromPromise(
                Promise.reject(
                  createPermissionDeniedError(
                    `User does not have permission to execute ${command.operation} on ${command.aggregateType}`,
                    {
                      userId: userContext.userId,
                      roles: userContext.roles,
                      requiredOperation: `${command.aggregateType}:${command.operation}`
                    }
                  )
                ),
                error => error as AppError
              )
            }

            logger.info('Authorization successful', {
              userId: userContext.userId,
              operation: command.operation,
              aggregateType: command.aggregateType
            })

            return next(command)
          })
      })
      .mapErr(error => {
        logger.error('Authorization process failed', error, { command })
        return error
      })
  }
}
