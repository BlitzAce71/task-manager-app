type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private isDevelopment = import.meta.env.DEV
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  debug(message: string, data?: any) {
    const entry = this.createLogEntry('debug', message, data)
    this.addToBuffer(entry)

    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '')
    }
  }

  info(message: string, data?: any) {
    const entry = this.createLogEntry('info', message, data)
    this.addToBuffer(entry)

    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '')
    } else {
      // In production, only log important info
      console.info(`[INFO] ${message}`)
    }
  }

  warn(message: string, data?: any) {
    const entry = this.createLogEntry('warn', message, data)
    this.addToBuffer(entry)

    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '')
    } else {
      console.warn(`[WARN] ${message}`)
    }
  }

  error(message: string, error?: Error | any) {
    const entry = this.createLogEntry('error', message, error)
    this.addToBuffer(entry)

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error || '')
    } else {
      // In production, log minimal error info
      console.error(`[ERROR] ${message}`, {
        message: error?.message || 'Unknown error',
        timestamp: entry.timestamp,
      })
      
      // TODO: Send to error reporting service
      // Example: Sentry.captureException(error, { extra: { logMessage: message } })
    }
  }

  // Method to get recent logs (useful for debugging or support)
  getRecentLogs(count = 20): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  // Method to clear log buffer
  clearBuffer() {
    this.logBuffer = []
  }

  // Method to export logs (useful for support/debugging)
  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2)
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience functions that match console API
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: Error | any) => logger.error(message, error),
}

export default logger