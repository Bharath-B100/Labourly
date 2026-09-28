import { useState } from 'react';
const pages = [
  'Dashboard',
  'Customers',
  'Workers',
  'Verification',
  'Requirements',
  'Bookings',
  'Settings',
] as const;
type Page = (typeof pages)[number];
export default function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:p-4">
        Skip to content
      </a>
      <aside className="bg-slate-950 p-6 text-white lg:min-h-screen">
        <div className="mb-10 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-xl bg-teal-400 font-black text-slate-950"
          >
            N
          </span>
          <div>
            <p className="text-xl font-bold">NammaCrew</p>
            <p className="text-xs tracking-widest text-slate-400">OPERATIONS</p>
          </div>
        </div>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap gap-2 lg:flex-col"
        >
          {pages.map((item) => (
            <button
              key={item}
              aria-current={page === item ? 'page' : undefined}
              onClick={() => setPage(item)}
              className={`min-h-12 rounded-lg px-4 text-left text-sm font-medium transition-colors ${page === item ? 'bg-teal-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              {item}
            </button>
          ))}
        </nav>
        <p className="mt-10 text-xs leading-5 text-slate-400">
          Phase 1 · Development shell
          <br />
          Provisional brand name
        </p>
      </aside>
      <main id="main" className="mx-auto w-full max-w-6xl p-6 md:p-10 lg:p-14">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-800">
              Workspace foundation
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {page}
            </h1>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Authentication not configured
          </span>
        </header>
        <section
          aria-labelledby="access-title"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10"
        >
          <div
            aria-hidden="true"
            className="mb-5 inline-flex rounded-xl bg-teal-50 p-3 text-2xl text-teal-900"
          >
            ↗
          </div>
          <h2 id="access-title" className="mb-3 text-2xl font-semibold">
            Operations start with secure access.
          </h2>
          <p className="max-w-xl leading-7 text-slate-600">
            {page} is not implemented. This is the navigation shell only.
            Administrative records will be available after secure sign-in and
            server-side role checks are implemented.
          </p>
          <p className="mt-6 border-t border-slate-100 pt-6 text-sm text-slate-500">
            No customer, worker, verification or booking data is loaded.
          </p>
        </section>
        <section
          aria-label="Foundation scope"
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          {[
            ['People', 'Customer and worker administration'],
            ['Trust', 'Verification review workflows'],
            ['Projects', 'Requirements and booking oversight'],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-xl border border-slate-200 p-6"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Planned capability
              </p>
              <h2 className="mb-2 text-lg font-semibold">{title}</h2>
              <p className="text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
        <footer className="mt-12 text-sm text-slate-500">
          Built for the people who build. India-first, ready to grow.
        </footer>
      </main>
    </div>
  );
}
