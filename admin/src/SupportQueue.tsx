import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl, getToken } from './api';
type Ticket = {
  id: string;
  kind: string;
  details: string;
  status: string;
  resolution: string | null;
  createdAt: string;
};
export function SupportQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const token = getToken();
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/support/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data: Ticket[] = await response.json();
      if (mounted.current && getToken() === token) setTickets(data);
    } catch {
      if (mounted.current)
        setError(
          'Cannot load support requests. An authorized administrator session is required.',
        );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  async function review(ticket: Ticket, status: string) {
    if (pending.current || !notes[ticket.id]?.trim()) return;
    pending.current = true;
    setBusy(ticket.id);
    setError('');
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/admin/support/requests/${ticket.id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, note: notes[ticket.id] }),
        },
      );
      if (!response.ok) throw new Error();
      if (mounted.current && getToken() === token) await load();
    } catch {
      if (mounted.current)
        setError(
          'Review was not confirmed. Refresh the queue before retrying.',
        );
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(null);
    }
  }
  return (
    <section>
      <h2>Support requests</h2>
      <p>
        Only authorized administrators can read this queue. Notes are visible to
        the requesting user. Do not include internal secrets.
      </p>
      <p>
        Deletion requests remain under review until the approved erasure process
        is implemented. Do not promise deletion or a resolution deadline that
        has not been agreed.
      </p>
      <button onClick={() => void load()} disabled={loading || !!busy}>
        Refresh requests
      </button>
      {loading && <p>Loading requests…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && tickets.length === 0 && <p>No open requests.</p>}
      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          style={{
            border: '1px solid #E5E7EB',
            padding: 16,
            marginTop: 16,
            borderRadius: 12,
          }}
        >
          <h3>
            {ticket.kind === 'ACCOUNT_DELETION'
              ? 'Account deletion'
              : 'Support'}{' '}
            — {ticket.status}
          </h3>
          <p>Reference: {ticket.id}</p>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {ticket.details}
          </p>
          {ticket.resolution && <p>Last response: {ticket.resolution}</p>}
          <label>
            Response to user
            <textarea
              aria-label={`Response for ${ticket.id}`}
              maxLength={2000}
              value={notes[ticket.id] ?? ''}
              onChange={(e) =>
                setNotes({ ...notes, [ticket.id]: e.target.value })
              }
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                minHeight: 80,
              }}
            />
          </label>
          <button
            disabled={!!busy || !notes[ticket.id]?.trim()}
            onClick={() => void review(ticket, 'IN_REVIEW')}
          >
            Save review
          </button>
          {ticket.kind !== 'ACCOUNT_DELETION' && (
            <button
              disabled={!!busy || !notes[ticket.id]?.trim()}
              onClick={() => void review(ticket, 'RESOLVED')}
            >
              Resolve support request
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
