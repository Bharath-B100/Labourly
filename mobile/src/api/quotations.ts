import { apiJson, apiFetch } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuoteView {
  id: string;
  requirementId: string;
  requirementTitle: string;
  workerId: string;
  workerName: string;
  amount: number;
  currency: string;
  pricingBasis: string;
  startsAt: string;
  durationDays: number;
  workerNote?: string;
  status: string;
  createdAt: string;
}

export interface BookingView {
  id: string;
  requirementId: string;
  requirementTitle: string;
  workerId: string;
  workerName: string;
  amount: number;
  currency: string;
  pricingBasis: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface SubmitQuotePayload {
  amount: number;
  pricingBasis: 'FIXED_TOTAL' | 'PER_DAY' | 'PER_WORKER_PER_DAY';
  startsAt: string; // ISO-8601
  durationDays: number;
  workerNote?: string;
}

// ── Quotation endpoints ───────────────────────────────────────────────────────

/** Worker: submit a quote for a requirement */
export async function submitQuote(
  requirementId: string,
  payload: SubmitQuotePayload,
): Promise<{ quoteId: string }> {
  return apiJson<{ quoteId: string }>(
    `/api/v1/requirements/${requirementId}/quotes`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

/** Customer: list quotes received for a requirement */
export async function getRequirementQuotes(
  requirementId: string,
): Promise<QuoteView[]> {
  return apiJson<QuoteView[]>(
    `/api/v1/requirements/${requirementId}/quotes`,
  );
}

/** Worker: list my submitted quotes */
export async function getMyQuotes(): Promise<QuoteView[]> {
  return apiJson<QuoteView[]>('/api/v1/quotes/me');
}

/** Customer: accept a quote */
export async function acceptQuote(quoteId: string): Promise<{ bookingId: string }> {
  return apiJson<{ bookingId: string }>(`/api/v1/quotes/${quoteId}/accept`, {
    method: 'POST',
  });
}

/** Customer: reject a quote */
export async function rejectQuote(quoteId: string): Promise<void> {
  await apiFetch(`/api/v1/quotes/${quoteId}/reject`, { method: 'POST' });
}

/** Worker: withdraw a quote */
export async function withdrawQuote(quoteId: string): Promise<void> {
  await apiFetch(`/api/v1/quotes/${quoteId}/withdraw`, { method: 'POST' });
}

// ── Booking endpoints ─────────────────────────────────────────────────────────

/** Customer or Worker: list my bookings */
export async function getMyBookings(): Promise<BookingView[]> {
  return apiJson<BookingView[]>('/api/v1/bookings/me');
}
