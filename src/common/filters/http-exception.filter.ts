import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'InternalServerError',
        };
    const normalized =
      typeof exceptionResponse === 'string'
        ? {
            statusCode: status,
            message: exceptionResponse,
            error: isHttpException ? exception.name : 'Error',
          }
        : (exceptionResponse as {
            statusCode?: number;
            message?: string | string[];
            error?: string;
          });

    response.status(status).json({
      timestamp: new Date().toISOString(),
      path: request.url,
      statusCode: normalized.statusCode ?? status,
      error: normalized.error ?? HttpStatus[status],
      message: normalized.message ?? 'Unexpected error',
    });
  }
}
