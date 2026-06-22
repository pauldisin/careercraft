import type { Response } from 'express';

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export const handleGlobalError = (res: Response, error: any, defaultCode: string, defaultMessage: string) => {
  if (error?.message?.includes('ECONNREFUSED') || error?.cause?.code === 'ECONNREFUSED' || error?.fullError?.cause?.code === 'ECONNREFUSED') {
    return sendApiError(res, 503, 'DATABASE_UNAVAILABLE', 'Database connection refused. Please configure a valid Postgres DATABASE_URL in the settings menu.');
  }
  return sendApiError(res, 500, defaultCode, defaultMessage);
};

export const sendApiError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
) => {
  res.status(statusCode).json({
    code,
    message,
    details,
  });
};
