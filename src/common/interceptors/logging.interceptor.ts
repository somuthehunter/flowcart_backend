import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // Generate Request ID and attach to request
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request['id'] = requestId;

    const startTime = Date.now();
    const { method, originalUrl, ip } = request;
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const env = process.env.NODE_ENV || 'development';

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        
        // Extract merchant ID if present (attached by auth guard)
        const merchantId = request['user']?.id || request['user']?.merchant_id || 'ANONYMOUS';

        const logMessage = `[${new Date().toISOString()}] [${requestId}] [${merchantId}] [${ip}] [${method}] [${originalUrl}] [${responseTime}ms] [${statusCode}] [${userAgent}] [${env}]`;
        this.logger.log(logMessage);
      }),
    );
  }
}
