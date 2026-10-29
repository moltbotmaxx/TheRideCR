const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { body, headers, credentials = "same-origin", ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body !== undefined) requestHeaders.set("Content-Type", "application/json");

  const controller = new AbortController();
  const abort = () => controller.abort(requestOptions.signal?.reason);
  if (requestOptions.signal?.aborted) abort();
  requestOptions.signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      credentials,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 204) return null;
    let data;
    try {
      data = await response.json();
    } catch {
      const error = new Error("The reservation service returned an invalid response.");
      error.status = response.status;
      error.code = "invalid_response";
      throw error;
    }
    if (!response.ok) {
      const error = new Error(data.error?.message || data.error || data.message || "Request failed.");
      error.status = response.status;
      error.code = data.code || data.error?.code;
      error.details = data.details;
      throw error;
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
    requestOptions.signal?.removeEventListener("abort", abort);
  }
}

export async function getReservations(options) {
  const data = await apiRequest("/api/reservations", options);
  return data.reservations;
}

export async function createReservation(data, idempotencyKey) {
  const result = await apiRequest("/api/reservations", {
    method: "POST",
    credentials: "omit",
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    body: data,
  });
  if (!result.reservation?.id) throw new Error("The reservation could not be verified.");
  return result.reservation;
}

export async function updateReservationStatus(id, status) {
  const data = await apiRequest(`/api/reservations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
  });
  return data.reservation;
}

export function removeReservation(id) {
  return apiRequest(`/api/reservations/${encodeURIComponent(id)}`, { method: "DELETE" });
}
