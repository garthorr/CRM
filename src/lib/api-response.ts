import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

export function notFound(message = "Not found") {
  return err(message, 404);
}

export function serverError(e: unknown) {
  console.error(e);
  return err("Internal server error", 500);
}
