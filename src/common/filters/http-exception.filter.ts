import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errorResponse: any = null;

    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse();
      message =
        typeof errorResponse === 'object' && errorResponse.message
          ? Array.isArray(errorResponse.message)
            ? errorResponse.message.join(', ')
            : errorResponse.message
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestId = request['id'] || 'N/A';
    const env = process.env.NODE_ENV || 'development';
    
    // In production, mask database/internal code errors
    const sanitizedMessage =
      status === HttpStatus.INTERNAL_SERVER_ERROR && env === 'production'
        ? 'Internal server error'
        : message;

    // Log the error
    this.logger.error(
      `[${new Date().toISOString()}] [${requestId}] [${request['user']?.id || 'ANONYMOUS'}] [${request.ip}] [${request.method}] [${request.originalUrl}] - Status: ${status} - Error: ${exception.message || exception}`,
      exception.stack,
    );

    response.status(status).json({
      success: false,
      message: sanitizedMessage,
      error: exception.name || 'Error',
      statusCode: status,
    });
  }
}
