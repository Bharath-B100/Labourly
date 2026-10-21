import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchHealth,
  fetchTrades,
  fetchWorkers,
  fetchOpportunities,
  requestOtp,
  verifyOtp,
  getToken,
  setToken,
  type HealthStatus,
  type Trade,
  type WorkerCard,
  type RequirementView,
} from './api';

// ── Palette ───────────────────────────────────────────────────────────────────
const Y = '#FFCC25';
const INK = '#202326';
const W = '#FFFFFF';
const G = '#E5E7EB';

// ── Custom hook: live-polling ─────────────────────────────────────────────────
function usePoll<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const doFetch = useCallback(
    async (signal: AbortSignal) => {
      try {
        const result = await fn(signal);
        if (!signal.aborted) {
          setData(result);
          setError(null);
          setLastUpdated(new Date());
        }
      } catch (e: unknown) {
        if (!signal.aborted)
          setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    const ac = new AbortController();
    void doFetch(ac.signal);
    const id = setInterval(() => void doFetch(ac.signal), intervalMs);
    return () => {
      clearInterval(id);
      ac.abort();
    };
  }, [doFetch, intervalMs]);

  return { data, error, loading, lastUpdated };
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'workers', label: 'Workers', icon: '👷' },
  { id: 'jobs', label: 'Jobs', icon: '📋' },
  { id: 'trades', label: 'Trades', icon: '🔧' },
] as const;
type Page = (typeof NAV)[number]['id'];

// ── Tiny components ───────────────────────────────────────────────────────────
function Badge({
  text,
  color = G,
  textColor = INK,
}: {
  text: string;
  color?: string;
  textColor?: string;
}) {
  return (
    <span
      style={{
        background: color,
        color: textColor,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
}

function Pulse({ alive }: { alive: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: alive ? '#22c55e' : '#ef4444',
          boxShadow: alive ? '0 0 0 2px #bbf7d0' : '0 0 0 2px #fecaca',
          display: 'inline-block',
          animation: alive ? 'pulseGlow 2s infinite' : 'none',
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: alive ? '#15803d' : '#b91c1c',
        }}
      >
        {alive ? 'LIVE' : 'DOWN'}
      </span>
    </span>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: W,
        borderRadius: 16,
        border: `1px solid ${G}`,
        padding: 20,
        boxShadow: '0 1px 6px rgba(32,35,38,.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: accent ?? INK,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function SectionHeader({
  title,
  updated,
}: {
  title: string;
  updated: Date | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: INK }}>
        {title}
      </h2>
      {updated && (
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          ↺ {updated.toLocaleTimeString('en-IN')}
        </span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `3px solid ${G}`,
          borderTopColor: INK,
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 12,
        padding: 16,
        color: '#b91c1c',
        fontSize: 13,
      }}
    >
      ⚠ {msg}
    </div>
  );
}

function AvailBar({ pct }: { pct: number }) {
  return (
    <div
      style={{ height: 6, background: G, borderRadius: 4, overflow: 'hidden' }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: pct > 50 ? '#22c55e' : Y,
          transition: 'width .5s ease',
        }}
      />
    </div>
  );
}

// ── Login Panel ───────────────────────────────────────────────────────────────
function LoginPanel({ onLogin }: { onLogin: (token: string) => void }) {
  const [phone, setPhone] = useState('+919999999990');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    setBusy(true);
    setError('');
    try {
      await requestOtp(phone);
      setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError('');
    try {
      const tokens = await verifyOtp(phone, otp);
      setToken(tokens.accessToken);
      onLogin(tokens.accessToken);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${G}`,
    fontSize: 14,
    color: INK,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#f9fafb',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px',
    borderRadius: 10,
    border: 'none',
    background: busy ? G : INK,
    color: busy ? '#6b7280' : W,
    fontSize: 14,
    fontWeight: 700,
    cursor: busy ? 'default' : 'pointer',
    fontFamily: 'inherit',
    transition: 'all .15s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}
    >
      <div
        style={{
          width: 380,
          background: W,
          borderRadius: 20,
          border: `1px solid ${G}`,
          padding: 36,
          boxShadow: '0 4px 24px rgba(32,35,38,.1)',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: INK,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                background: Y,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 14,
                color: INK,
              }}
            >
              L
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: INK }}>
              Labourly Admin
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#9ca3af',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Operations Dashboard
            </div>
          </div>
        </div>

        <h2
          style={{ fontSize: 20, fontWeight: 800, color: INK, marginBottom: 6 }}
        >
          {step === 'phone' ? 'Sign in with phone' : 'Enter OTP'}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {step === 'phone'
            ? 'Use a registered phone number. Dev shortcut: +919999999990'
            : `OTP sent to ${phone}. Dev shortcut: 123456`}
        </p>

        {step === 'phone' ? (
          <>
            <input
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              type="tel"
            />
            <div style={{ height: 12 }} />
            <button style={btnStyle} onClick={sendOtp} disabled={busy}>
              {busy ? 'Sending…' : 'Send OTP →'}
            </button>
          </>
        ) : (
          <>
            <input
              style={inputStyle}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              type="text"
              maxLength={6}
              autoFocus
            />
            <div style={{ height: 12 }} />
            <button
              style={btnStyle}
              onClick={verify}
              disabled={busy || otp.length < 6}
            >
              {busy ? 'Verifying…' : 'Sign In →'}
            </button>
            <button
              style={{
                ...btnStyle,
                background: 'transparent',
                color: '#6b7280',
                border: `1px solid ${G}`,
                marginTop: 10,
              }}
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
            >
              ← Change number
            </button>
          </>
        )}

        {error && (
          <div
            style={{
              marginTop: 14,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#b91c1c',
            }}
          >
            ⚠ {error}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            padding: '14px',
            background: '#fffbeb',
            border: `1px solid #fde68a`,
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Dev shortcut
          </div>
          <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>
            Phone:{' '}
            <code
              style={{
                background: '#fef3c7',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              +919999999990
            </code>
            <br />
            OTP:{' '}
            <code
              style={{
                background: '#fef3c7',
                padding: '1px 5px',
                borderRadius: 4,
              }}
            >
              123456
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
function DashboardPage() {
  const health = usePoll<HealthStatus>(fetchHealth, 10_000);
  const workers = usePoll(
    (s) =>
      fetchWorkers(
        { page: 0, size: 100, lat: 12.9716, lng: 77.5946, radiusKm: 500 },
        s,
      ),
    30_000,
  );
  const jobs = usePoll(
    (s) => fetchOpportunities({ page: 0, size: 100 }, s),
    30_000,
  );
  const trades = usePoll(fetchTrades, 60_000);

  const alive = health.data?.status === 'UP';
  const workerList = workers.data?.items ?? [];
  const jobList = jobs.data?.items ?? [];
  const tradeList = trades.data ?? [];

  const available = workerList.filter(
    (w) => w.availability === 'AVAILABLE',
  ).length;
  const verified = workerList.filter(
    (w) => w.verificationStatus === 'APPROVED',
  ).length;
  const openJobs = jobList.filter((j) => j.status === 'OPEN').length;

  const tradeMap: Record<string, number> = {};
  workerList.forEach((w) => {
    tradeMap[w.trade] = (tradeMap[w.trade] ?? 0) + 1;
  });
  const topTrades = Object.entries(tradeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const cityMap: Record<string, number> = {};
  workerList.forEach((w) => {
    const k = `${w.city}`;
    cityMap[k] = (cityMap[k] ?? 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const availPct =
    workerList.length > 0
      ? Math.round((available / workerList.length) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Labourly · Admin
          </p>
          <h1
            style={{
              margin: '4px 0 0',
              fontSize: 28,
              fontWeight: 900,
              color: INK,
            }}
          >
            Live Dashboard
          </h1>
        </div>
        <Pulse alive={alive} />
      </div>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Workers"
          value={
            workers.loading ? '…' : (workers.data?.total ?? workerList.length)
          }
          sub="Indexed"
        />
        <StatCard
          label="Available Now"
          value={workers.loading ? '…' : available}
          accent="#15803d"
          sub={`${availPct}% available`}
        />
        <StatCard
          label="Verified"
          value={workers.loading ? '…' : verified}
          sub="Identity approved"
        />
        <StatCard
          label="Open Jobs"
          value={jobs.loading ? '…' : openJobs}
          accent="#b45309"
          sub="Awaiting workers"
        />
        <StatCard
          label="Total Jobs"
          value={jobs.loading ? '…' : (jobs.data?.total ?? jobList.length)}
          sub="All requirements"
        />
        <StatCard
          label="Trades"
          value={trades.loading ? '…' : tradeList.length}
          sub="Active categories"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          marginBottom: 18,
        }}
      >
        <Card>
          <SectionHeader
            title="Workers by Trade"
            updated={workers.lastUpdated}
          />
          {workers.loading ? (
            <Spinner />
          ) : workers.error ? (
            <ErrorBox msg={workers.error} />
          ) : topTrades.length === 0 ? (
            <p
              style={{
                color: '#9ca3af',
                fontSize: 13,
                textAlign: 'center',
                padding: 16,
              }}
            >
              No worker data yet.
            </p>
          ) : (
            topTrades.map(([trade, count]) => (
              <div key={trade} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 600,
                    color: INK,
                    marginBottom: 4,
                  }}
                >
                  <span>{trade}</span>
                  <span style={{ color: '#6b7280' }}>{count}</span>
                </div>
                <AvailBar pct={Math.round((count / workerList.length) * 100)} />
              </div>
            ))
          )}
        </Card>
        <Card>
          <SectionHeader
            title="Workers by City"
            updated={workers.lastUpdated}
          />
          {workers.loading ? (
            <Spinner />
          ) : workers.error ? (
            <ErrorBox msg={workers.error} />
          ) : topCities.length === 0 ? (
            <p
              style={{
                color: '#9ca3af',
                fontSize: 13,
                textAlign: 'center',
                padding: 16,
              }}
            >
              No city data yet.
            </p>
          ) : (
            topCities.map(([city, count]) => (
              <div key={city} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 600,
                    color: INK,
                    marginBottom: 4,
                  }}
                >
                  <span>{city}</span>
                  <span style={{ color: '#6b7280' }}>{count}</span>
                </div>
                <AvailBar pct={Math.round((count / workerList.length) * 100)} />
              </div>
            ))
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Recent Job Requirements"
          updated={jobs.lastUpdated}
        />
        {jobs.loading ? (
          <Spinner />
        ) : jobs.error ? (
          <ErrorBox msg={jobs.error} />
        ) : jobList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            <p style={{ fontSize: 28 }}>📋</p>
            <p>No job requirements posted yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${G}` }}>
                  {[
                    'Title',
                    'Trade',
                    'Workers',
                    'Location',
                    'Status',
                    'Starts',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        fontWeight: 700,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        fontSize: 11,
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobList.slice(0, 12).map((j) => (
                  <tr key={j.id} style={{ borderBottom: `1px solid ${G}` }}>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: INK,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {j.title}
                    </td>
                    <td style={{ padding: '10px 12px', color: INK }}>
                      {j.trade}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        color: INK,
                        textAlign: 'center',
                      }}
                    >
                      {j.workerCount}
                    </td>
                    <td style={{ padding: '10px 12px', color: INK }}>
                      {j.city}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge
                        text={j.status}
                        color={j.status === 'OPEN' ? Y : G}
                        textColor={INK}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                      {new Date(j.startsAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Workers Page ──────────────────────────────────────────────────────────────
function WorkersPage() {
  const [page, setPage] = useState(0);
  const [selectedTrade, setSelectedTrade] = useState('');
  const pageRef = useRef(page);
  const tradeRef = useRef(selectedTrade);
  pageRef.current = page;
  tradeRef.current = selectedTrade;

  const workers = usePoll(
    (s) =>
      fetchWorkers(
        {
          page: pageRef.current,
          size: 20,
          lat: 12.9716,
          lng: 77.5946,
          radiusKm: 500,
          tradeId: tradeRef.current || undefined,
        },
        s,
      ),
    20_000,
    [page, selectedTrade],
  );
  const trades = usePoll(fetchTrades, 120_000);
  const list = workers.data?.items ?? [];
  const total = workers.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: INK }}>
          Workers
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {workers.loading ? '…' : `${total} total workers`}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <select
          value={selectedTrade}
          onChange={(e) => {
            setSelectedTrade(e.target.value);
            setPage(0);
          }}
          style={{
            border: `1px solid ${G}`,
            borderRadius: 10,
            padding: '9px 14px',
            fontSize: 13,
            color: INK,
            background: W,
            cursor: 'pointer',
          }}
        >
          <option value="">All Trades</option>
          {(trades.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {workers.lastUpdated && (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            ↺ {workers.lastUpdated.toLocaleTimeString('en-IN')}
          </span>
        )}
      </div>
      <Card>
        {workers.loading ? (
          <Spinner />
        ) : workers.error ? (
          <ErrorBox msg={workers.error} />
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <p style={{ fontSize: 28 }}>👷</p>
            <p>No workers found in the index.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${G}` }}>
                    {[
                      'Name',
                      'Trade',
                      'Type',
                      'Availability',
                      'Verification',
                      'Location',
                      'Exp',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontWeight: 700,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontSize: 11,
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((w: WorkerCard) => (
                    <tr key={w.id} style={{ borderBottom: `1px solid ${G}` }}>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontWeight: 700,
                          color: INK,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: Y,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13,
                              color: INK,
                              flexShrink: 0,
                            }}
                          >
                            {w.name.charAt(0)}
                          </div>
                          {w.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{w.trade}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                        {w.workerType}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge
                          text={w.availability}
                          color={w.availability === 'AVAILABLE' ? '#d1fae5' : G}
                          textColor={
                            w.availability === 'AVAILABLE' ? '#065f46' : INK
                          }
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge
                          text={w.verificationStatus}
                          color={w.verificationStatus === 'APPROVED' ? Y : G}
                          textColor={INK}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', color: INK }}>
                        {w.city}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#6b7280',
                          textAlign: 'center',
                        }}
                      >
                        {w.experienceYears}y
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1px solid ${G}`,
                    background: page === 0 ? G : W,
                    cursor: page === 0 ? 'default' : 'pointer',
                    color: INK,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1px solid ${G}`,
                    background: page >= totalPages - 1 ? G : W,
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    color: INK,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ── Jobs Page ─────────────────────────────────────────────────────────────────
function JobsPage() {
  const [page, setPage] = useState(0);
  const pageRef = useRef(page);
  pageRef.current = page;

  const jobs = usePoll(
    (s) => fetchOpportunities({ page: pageRef.current, size: 20 }, s),
    20_000,
    [page],
  );
  const list = jobs.data?.items ?? [];
  const total = jobs.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const statusCounts: Record<string, number> = {};
  list.forEach((j) => {
    statusCounts[j.status] = (statusCounts[j.status] ?? 0) + 1;
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: INK }}>
          Job Requirements
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {jobs.loading ? '…' : `${total} requirements`}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 18,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {Object.entries(statusCounts).map(([status, count]) => (
          <Badge
            key={status}
            text={`${status} (${count})`}
            color={status === 'OPEN' ? Y : G}
            textColor={INK}
          />
        ))}
        {jobs.lastUpdated && (
          <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
            ↺ {jobs.lastUpdated.toLocaleTimeString('en-IN')}
          </span>
        )}
      </div>
      <Card>
        {jobs.loading ? (
          <Spinner />
        ) : jobs.error ? (
          <ErrorBox msg={jobs.error} />
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <p style={{ fontSize: 28 }}>📋</p>
            <p>No job requirements on the marketplace yet.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: `2px solid ${G}` }}>
                    {[
                      'Title',
                      'Trade',
                      'Skills',
                      'Workers',
                      'City',
                      'Status',
                      'Period',
                      'Posted',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontWeight: 700,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          fontSize: 11,
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((j: RequirementView) => (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${G}` }}>
                      <td
                        style={{
                          padding: '10px 12px',
                          fontWeight: 700,
                          color: INK,
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {j.title}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{j.trade}</td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#6b7280',
                          maxWidth: 120,
                        }}
                      >
                        {j.skills.slice(0, 2).join(', ')}
                        {j.skills.length > 2 ? ` +${j.skills.length - 2}` : ''}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {j.workerCount}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{j.city}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge
                          text={j.status}
                          color={j.status === 'OPEN' ? Y : G}
                          textColor={INK}
                        />
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#6b7280',
                          fontSize: 11,
                        }}
                      >
                        {new Date(j.startsAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        –{' '}
                        {new Date(j.endsAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          color: '#9ca3af',
                          fontSize: 11,
                        }}
                      >
                        {new Date(j.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1px solid ${G}`,
                    background: page === 0 ? G : W,
                    cursor: page === 0 ? 'default' : 'pointer',
                    color: INK,
                  }}
                >
                  ← Prev
                </button>
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: `1px solid ${G}`,
                    background: page >= totalPages - 1 ? G : W,
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    color: INK,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ── Trades Page ───────────────────────────────────────────────────────────────
function TradesPage() {
  const trades = usePoll(fetchTrades, 30_000);
  const list = trades.data ?? [];
  const ICONS: Record<string, string> = {
    CARPENTER: '🪚',
    ELECTRICIAN: '⚡',
    PLUMBER: '🔧',
    PAINTER: '🖌️',
    MASON: '🧱',
    WELDER: '🔥',
    HELPER: '📦',
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: INK }}>
          Trades Catalogue
        </h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
          {trades.loading ? '…' : `${list.length} trades`}
        </p>
      </div>
      {trades.lastUpdated && (
        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>
          ↺ {trades.lastUpdated.toLocaleTimeString('en-IN')}
        </p>
      )}
      {trades.loading ? (
        <Spinner />
      ) : trades.error ? (
        <ErrorBox msg={trades.error} />
      ) : list.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <p style={{ fontSize: 28 }}>🔧</p>
            <p>No trades in catalogue.</p>
          </div>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {list.map((trade: Trade) => (
            <Card key={trade.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: Y,
                    borderRadius: 10,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {ICONS[trade.code] ?? '🏗️'}
                </div>
                <Badge text={trade.code} color={G} textColor={INK} />
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: INK,
                  marginBottom: 8,
                }}
              >
                {trade.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                Skills ({trade.skills.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {trade.skills.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      background: '#f3f4f6',
                      border: `1px solid ${G}`,
                      borderRadius: 6,
                      padding: '2px 8px',
                      fontSize: 11,
                      color: INK,
                      fontWeight: 600,
                    }}
                  >
                    {s.name}
                  </span>
                ))}
                {trade.skills.length === 0 && (
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>
                    No skills listed
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [page, setPage] = useState<Page>('dashboard');
  const health = usePoll<HealthStatus>(fetchHealth, 10_000);
  const alive = health.data?.status === 'UP';

  const handleLogin = (t: string) => setTokenState(t);
  const handleLogout = () => {
    setToken(null);
    setTokenState(null);
  };

  if (!token) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Inter', system-ui, sans-serif; }`}</style>
        <LoginPanel onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', system-ui, sans-serif; background: #F9FAFB; color: ${INK}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 #bbf7d0; } 50% { box-shadow: 0 0 0 5px transparent; } }
        select, button { outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: ${G}; border-radius: 4px; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: 210,
            background: INK,
            color: W,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 14px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: Y,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 18,
                color: INK,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>
                Labourly
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: G,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Operations
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              flex: 1,
            }}
          >
            {NAV.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    textAlign: 'left',
                    background: active ? Y : 'transparent',
                    color: active ? INK : G,
                    fontWeight: active ? 800 : 500,
                    fontSize: 13,
                    transition: 'all 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Health */}
          <div
            style={{
              padding: '12px',
              borderRadius: 10,
              background: '#2d3136',
              marginTop: 16,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: G,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 5,
              }}
            >
              API Server
            </div>
            <Pulse alive={alive} />
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>
              {health.loading
                ? 'Checking…'
                : alive
                  ? 'Backend healthy'
                  : 'Cannot reach'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid #3d4148`,
              background: 'transparent',
              color: G,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⎋ Sign out
          </button>
        </aside>

        {/* Main */}
        <main
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowX: 'hidden',
            minWidth: 0,
          }}
        >
          {page === 'dashboard' && <DashboardPage />}
          {page === 'workers' && <WorkersPage />}
          {page === 'jobs' && <JobsPage />}
          {page === 'trades' && <TradesPage />}
        </main>
      </div>
    </>
  );
}
