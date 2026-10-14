import { apiJson } from '../api/client';
import { getMyQuotes } from '../api/quotations';
import type { NotificationItem } from '../api/notifications';
import type { Session } from '../auth/session';

export async function notificationRoute(
  item: NotificationItem,
  session: Session,
): Promise<string> {
  const id = item.referenceId;
  if (
    item.userId !== session.userId ||
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new Error(
      'This notification no longer has an accessible destination.',
    );
  }
  const worker = session.roles.includes('WORKER');
  const customer = session.roles.includes('CUSTOMER');
  if (item.type === 'QUOTE_REJECTED' && worker) {
    const quotes = await getMyQuotes();
    if (!quotes.some((quote) => quote.requirementId === id))
      throw new Error('This quote is no longer available.');
    return '/(worker)/schedule';
  }
  if (
    (item.type === 'QUOTE_RECEIVED' && customer) ||
    (item.type === 'WORK_AVAILABLE' && worker)
  ) {
    const requirement = await apiJson<{ status: string }>(
      `/api/v1/requirements/${id}`,
    );
    if (item.type === 'WORK_AVAILABLE' && requirement.status !== 'OPEN')
      throw new Error('This opportunity is no longer open.');
    return item.type === 'QUOTE_RECEIVED'
      ? `/(customer)/requirement/${id}`
      : `/(worker)/opportunity/${id}`;
  }
  if (
    ['QUOTE_ACCEPTED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED'].includes(
      item.type,
    ) &&
    (worker || customer)
  ) {
    await apiJson(`/api/v1/bookings/${id}`);
    return worker ? `/(worker)/booking/${id}` : `/(customer)/booking/${id}`;
  }
  throw new Error(
    'This notification has no available destination for this account.',
  );
}
