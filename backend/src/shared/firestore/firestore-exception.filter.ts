import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class FirestoreExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('FirestoreException');

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';

        // Handle NestJS HttpExceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse() as any;
            message = typeof res === 'string' ? res : res.message || message;
            code = res.error || code;
        }
        // Handle Firestore/Firebase errors
        else if (exception.code !== undefined) {
            // Firebase gRPC error codes
            // 9 is FAILED_PRECONDITION (often missing index)
            if (exception.code === 9 || exception.code === 'failed-precondition') {
                status = HttpStatus.BAD_REQUEST;
                code = 'FIRESTORE_INDEX_REQUIRED';

                const details = exception.details || exception.message || '';
                if (details.includes('https://console.firebase.google.com')) {
                    const link = details.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
                    message = `Firestore index required. Create it here: ${link}`;
                    this.logger.error(`INDEX CREATION LINK: ${link}`);
                } else {
                    message = 'Firestore query failed (likely missing index). Check server logs for details.';
                }
            } else {
                message = exception.details || exception.message || message;
            }

            this.logger.error(`Firestore Error [${exception.code}]: ${exception.details || exception.message}`);
        } else {
            this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
            code,
        });
    }
}
