/**
 * Logging utility for the Discord bot
 * Provides structured logging with multiple severity levels
 * Includes timestamp, context, and error stack traces
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  context?: string;
  error?: Error | unknown;
  userId?: string;
  guildId?: string;
  [key: string]: any;
}

const LogLevelValues = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const LogColors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m' // Red
};

const Reset = '\x1b[0m';

/**
 * Formats a log message with timestamp and context
 */
function formatMessage(level: LogLevel, message: string, ctx?: LogContext): string {
  const timestamp = new Date().toISOString();
  const color = LogColors[level];
  const levelStr = level.toUpperCase().padEnd(6);
  
  let formattedMsg = `${color}[${timestamp}] [${levelStr}]${Reset} ${message}`;
  
  if (ctx) {
    if (ctx.context) {
      formattedMsg += ` (${ctx.context})`;
    }
    if (ctx.userId) {
      formattedMsg += ` | User: ${ctx.userId}`;
    }
    if (ctx.guildId) {
      formattedMsg += ` | Guild: ${ctx.guildId}`;
    }
  }
  
  return formattedMsg;
}

/**
 * Extracts error message and stack from error objects
 */
function formatError(error: Error | unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  return String(error);
}

/**
 * Logger object with methods for each log level
 */
export const logger = {
  /**
   * Debug level - For detailed diagnostic information
   * @param message - The message to log
   * @param context - Optional context information
   */
  debug(message: string, context?: LogContext): void {
    const minLevel = process.env.LOG_LEVEL || 'info';
    if (LogLevelValues.debug < LogLevelValues[minLevel as LogLevel]) return;
    
    const formatted = formatMessage('debug', message, context);
    console.log(formatted);
  },

  /**
   * Info level - For informational messages
   * @param message - The message to log
   * @param context - Optional context information
   */
  info(message: string, context?: LogContext): void {
    const minLevel = process.env.LOG_LEVEL || 'info';
    if (LogLevelValues.info < LogLevelValues[minLevel as LogLevel]) return;
    
    const formatted = formatMessage('info', message, context);
    console.log(formatted);
  },

  /**
   * Warn level - For warnings that don't stop execution
   * @param message - The message to log
   * @param context - Optional context information
   */
  warn(message: string, context?: LogContext): void {
    const minLevel = process.env.LOG_LEVEL || 'info';
    if (LogLevelValues.warn < LogLevelValues[minLevel as LogLevel]) return;
    
    const formatted = formatMessage('warn', message, context);
    console.warn(formatted);
    
    if (context?.error) {
      console.warn(`Error details: ${formatError(context.error)}`);
    }
  },

  /**
   * Error level - For errors that may stop execution
   * @param message - The message to log
   * @param context - Optional context information with error
   */
  error(message: string, context?: LogContext): void {
    const minLevel = process.env.LOG_LEVEL || 'info';
    if (LogLevelValues.error < LogLevelValues[minLevel as LogLevel]) return;
    
    const formatted = formatMessage('error', message, context);
    console.error(formatted);
    
    if (context?.error) {
      console.error(`Error details: ${formatError(context.error)}`);
    }
  },

  /**
   * Logs an interaction error with user and guild context
   */
  interactionError(message: string, interaction: any, error: Error | unknown): void {
    this.error(message, {
      context: 'InteractionHandler',
      error,
      userId: interaction.user?.id,
      guildId: interaction.guild?.id,
      commandName: interaction.commandName || interaction.customId
    });
  },

  /**
   * Logs a command execution
   */
  commandExecuted(commandName: string, userId: string, success: boolean): void {
    const status = success ? '✓' : '✗';
    this.info(`${status} Command executed: ${commandName}`, {
      context: 'CommandExecution',
      userId
    });
  },

  /**
   * Logs database operations
   */
  dbOperation(operation: string, success: boolean, error?: Error | unknown): void {
    if (success) {
      this.debug(`DB operation completed: ${operation}`, {
        context: 'Database'
      });
    } else {
      this.error(`DB operation failed: ${operation}`, {
        context: 'Database',
        error
      });
    }
  }
};

export default logger;
