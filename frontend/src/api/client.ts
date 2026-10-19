import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { isAxiosError } from 'axios';
import { getAuthToken, notifyUnauthorized } from './session';

/** Base URL of the API. In development Vite proxies "/api" to the local backend. */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const http = axios.create({ baseURL: API_URL, timeout: 20_000 });

export interface FieldError {
  field: string;
  message: string;
}

/** Normalised error shape used throughout the app. */
export interface ApiError {
  status: number;
  message: string;
  details?: FieldError[];
}

export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.response) {
      const body = error.response.data as Partial<ApiError> | undefined;
      return {
        status: error.response.status,
        message: body?.message || error.message,
        details: body?.details,
      };
    }
    if (error.code === 'ECONNABORTED') {
      return { status: 0, message: 'The server took too long to respond. Please try again.' };
    }
    return { status: 0, message: 'Cannot reach the server. Check your connection and try again.' };
  }
  return { status: 0, message: error instanceof Error ? error.message : 'Something went wrong' };
}

/** Reads a user-facing message from anything thrown by an RTK Query hook or `unwrap()`. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

/** Maps API validation details to a `{ field: message }` object for forms. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const details = (error as ApiError | undefined)?.details ?? [];
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
}

export interface RequestArgs {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  params?: object;
}

/** RTK Query base query built on axios that attaches the JWT and handles expired sessions. */
export const axiosBaseQuery: BaseQueryFn<RequestArgs, unknown, ApiError> = async (args, api) => {
  const token = getAuthToken();
  try {
    const response = await http.request({
      url: args.url,
      method: args.method ?? 'GET',
      data: args.data,
      params: args.params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: api.signal,
    });
    return { data: response.data };
  } catch (error) {
    const apiError = toApiError(error);
    // A 401 on an authenticated request means the token is no longer valid.
    if (apiError.status === 401 && token) notifyUnauthorized(token);
    return { error: apiError };
  }
};
