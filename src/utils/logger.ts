import type { AppError } from '../types/app-error'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  readonly timestamp: Date
  readonly level: LogLevel
  readonly message: string
  readonly error?: AppError
  readonly details?: unknown
  readonly metadata?: Record<string, unknown>
}

export interface Logger {
  debug(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void
  info(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void
  warn(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void
  error(
    message: string,
    error: AppError,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void
}

class ConsoleLogger implements Logger {
  private formatContext(context: LogContext): string {
    const { timestamp, level, message, error, details, metadata } = context
    const parts = [
      `[${timestamp.toISOString()}]`,
      `[${level.toUpperCase()}]`,
      message
    ]

    if (error) {
      parts.push(`\nError: ${JSON.stringify(error, null, 2)}`)
    }

    if (details) {
      parts.push(`\nDetails: ${JSON.stringify(details, null, 2)}`)
    }

    if (metadata) {
      parts.push(`\nMetadata: ${JSON.stringify(metadata, null, 2)}`)
    }

    return parts.join(' ')
  }

  private log(
    level: LogLevel,
    message: string,
    error?: AppError,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    const context: LogContext = {
      timestamp: new Date(),
      level,
      message,
      error,
      details,
      metadata
    }

    const formattedMessage = this.formatContext(context)

    switch (level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }
  }

  debug(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log('debug', message, undefined, details, metadata)
  }

  info(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log('info', message, undefined, details, metadata)
  }

  warn(
    message: string,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log('warn', message, undefined, details, metadata)
  }

  error(
    message: string,
    error: AppError,
    details?: unknown,
    metadata?: Record<string, unknown>
  ): void {
    this.log('error', message, error, details, metadata)
  }
}

export const logger: Logger = new ConsoleLogger()
