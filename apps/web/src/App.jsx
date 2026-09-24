import { useEffect, useMemo, useState } from 'react';
import { graphqlRequest, login, runDiagnostic } from './api.js';

const DASHBOARD_QUERY = `
  query SupportDashboard {
    services {
      id
      name
      owner
      tier
      health
      endpoint
      dependencies {
        id
        name
        health
      }
      incidents {
        id
        title
        severity
        status
        createdAt
      }
      runbooks {
        id
        title
        description
      }
    }
  }
`;

function Login({ onAuthenticated }) {
  const [username, setUsername] = useState('developer');
  const [password, setPassword] = useState('demo-password');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const session = await login(username, password);
      onAuthenticated(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="eyebrow">Developer Support Automation</div>
        <h1>DevAssist</h1>
        <p>
          One support surface for service context, incidents, runbooks, and
          deterministic diagnostics.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        <small>Local demo credentials are pre-filled.</small>
      </section>
    </main>
  );
}

function StatusBadge({ value }) {
  return <span className={`badge badge-${value.toLowerCase()}`}>{value}</span>;
}

function DiagnosticPanel({ result }) {
  if (!result) {
    return (
      <div className="empty-state">
        Run a deterministic diagnostic to validate service fundamentals.
      </div>
    );
  }

  return (
    <div className="diagnostic-result">
      <div className="diagnostic-summary">
        <StatusBadge value={result.status} />
        <span>{result.summary}</span>
      </div>

      <div className="check-list">
        {result.checks.map((check) => (
          <div className="check-row" key={check.id}>
            <StatusBadge value={check.status} />
            <div>
              <strong>{check.name}</strong>
              <p>{check.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ session, onLogout }) {
  const [services, setServices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [diagnostic, setDiagnostic] = useState(null);
  const [busyDiagnostic, setBusyDiagnostic] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    graphqlRequest(session.token, DASHBOARD_QUERY)
      .then((data) => {
        setServices(data.services);
        setSelectedId(data.services[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, [session.token]);

  const selected = useMemo(
    () => services.find((service) => service.id === selectedId),
    [services, selectedId]
  );

  async function handleDiagnostic() {
    if (!selected) return;

    setBusyDiagnostic(true);
    setError('');

    try {
      setDiagnostic(await runDiagnostic(session.token, selected.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyDiagnostic(false);
    }
  }

  function selectService(id) {
    setSelectedId(id);
    setDiagnostic(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Developer Support Automation</div>
          <h1>DevAssist</h1>
        </div>

        <div className="user-area">
          <span>{session.user.displayName}</span>
          <button className="secondary" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {error && <div className="error banner">{error}</div>}

      <section className="workspace">
        <aside className="service-list">
          <div className="section-heading">
            <h2>Services</h2>
            <span>{services.length}</span>
          </div>

          {services.map((service) => (
            <button
              key={service.id}
              className={`service-button ${
                selectedId === service.id ? 'active' : ''
              }`}
              onClick={() => selectService(service.id)}
            >
              <div>
                <strong>{service.name}</strong>
                <small>{service.owner}</small>
              </div>
              <StatusBadge value={service.health} />
            </button>
          ))}
        </aside>

        <section className="detail-panel">
          {!selected ? (
            <div className="empty-state">Select a service.</div>
          ) : (
            <>
              <div className="hero">
                <div>
                  <div className="eyebrow">{selected.tier.replace('_', ' ')}</div>
                  <h2>{selected.name}</h2>
                  <p>{selected.endpoint}</p>
                </div>
                <StatusBadge value={selected.health} />
              </div>

              <div className="grid">
                <article className="card">
                  <h3>Dependencies</h3>
                  {selected.dependencies.length === 0 ? (
                    <p className="muted">No service dependencies.</p>
                  ) : (
                    selected.dependencies.map((dependency) => (
                      <div className="list-row" key={dependency.id}>
                        <span>{dependency.name}</span>
                        <StatusBadge value={dependency.health} />
                      </div>
                    ))
                  )}
                </article>

                <article className="card">
                  <h3>Incidents</h3>
                  {selected.incidents.length === 0 ? (
                    <p className="muted">No active or recent incidents.</p>
                  ) : (
                    selected.incidents.map((incident) => (
                      <div className="stack-row" key={incident.id}>
                        <strong>{incident.title}</strong>
                        <span>
                          {incident.severity} · {incident.status}
                        </span>
                      </div>
                    ))
                  )}
                </article>

                <article className="card">
                  <h3>Runbooks</h3>
                  {selected.runbooks.map((runbook) => (
                    <div className="stack-row" key={runbook.id}>
                      <strong>{runbook.title}</strong>
                      <span>{runbook.description}</span>
                    </div>
                  ))}
                </article>

                <article className="card diagnostics-card">
                  <div className="card-heading">
                    <h3>Diagnostics</h3>
                    <button disabled={busyDiagnostic} onClick={handleDiagnostic}>
                      {busyDiagnostic ? 'Running…' : 'Run diagnostic'}
                    </button>
                  </div>
                  <DiagnosticPanel result={diagnostic} />
                </article>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    const raw = sessionStorage.getItem('devassist-session');
    return raw ? JSON.parse(raw) : null;
  });

  function handleAuthenticated(nextSession) {
    sessionStorage.setItem('devassist-session', JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    sessionStorage.removeItem('devassist-session');
    setSession(null);
  }

  if (!session) {
    return <Login onAuthenticated={handleAuthenticated} />;
  }

  return <Dashboard session={session} onLogout={handleLogout} />;
}
