import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "API_KEY_MISSING"
  | "RATE_LIMITED"
  | "RUN_CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(message: string) {
  return apiError("VALIDATION_ERROR", message, 400);
}

export function notFound(message = "対象が見つかりません") {
  return apiError("NOT_FOUND", message, 404);
}

export function internalError(message = "サーバーエラーが発生しました") {
  return apiError("INTERNAL_ERROR", message, 500);
}
