/**
 * Production-ready logging service
 * Replaces console.log statements with proper logging levels
 */

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? 'debug' : 'error';
  }

  // Set log level: 'debug', 'info', 'warn', 'error'
  setLogLevel(level) {
    this.logLevel = level;
  }

  // Check if a log level should be output
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  // Format log message with timestamp and context
  formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  // Debug level - only in development
  debug(message, context = {}) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Info level - important information
  info(message, context = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  // Warning level - potential issues
  warn(message, context = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  // Error level - actual errors
  error(message, context = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
      
      // In production, you might want to send errors to a logging service
      if (!this.isDevelopment) {
        this.sendToLoggingService('error', message, context);
      }
    }
  }

  // Send logs to external logging service (implement as needed)
  sendToLoggingService(level, message, context) {
    // Example: Send to external logging service like Sentry, LogRocket, etc.
    // This is a placeholder - implement based on your logging service
    try {
      // Example implementation:
      // Sentry.captureMessage(message, level, { extra: context });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to external service:', error);
    }
  }

  // API request/response logging
  logApiRequest(method, url, data = null) {
    this.debug(`API Request: ${method} ${url}`, { data });
  }

  logApiResponse(method, url, status, data = null) {
    const level = status >= 400 ? 'error' : 'debug';
    this[level](`API Response: ${method} ${url} - ${status}`, { data });
  }

  // Game-specific logging
  logGameEvent(event, gameId, data = {}) {
    this.info(`Game Event: ${event}`, { gameId, ...data });
  }

  // User action logging
  logUserAction(action, userId, context = {}) {
    this.info(`User Action: ${action}`, { userId, ...context });
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
