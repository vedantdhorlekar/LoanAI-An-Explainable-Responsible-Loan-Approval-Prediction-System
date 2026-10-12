import { useEffect, useRef, useState } from "react";
import { getMetrics, predict } from "./api.js";
import ApplicantForm from "./components/ApplicantForm.jsx";
import BulkUpload from "./components/BulkUpload.jsx";
import History from "./components/History.jsx";
import Insights from "./components/Insights.jsx";
import FairnessAudit from "./components/FairnessAudit.jsx";
import Monitoring from "./components/Monitoring.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import { PRESETS } from "./format.js";

const TABS = [
  ["dashboard", "Dashboard"],
  ["insights", "Model Insights"],
  ["fairness", "Fairness Audit"],
  ["monitor", "Monitoring"],
  ["bulk", "Bulk Predict"],
  ["history", "History"],
];
const initialForm = PRESETS["Typical applicant"];

const store = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [snapshot, setSnapshot] = useState(null);   // the form the result was computed from
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState(() => store.get("loanai-history", []));
  const [theme, setTheme] = useState(() => store.get("loanai-theme", null));
  const resultRef = useRef();

  useEffect(() => { getMetrics().then(setMetrics).catch(() => {}); }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme); else root.removeAttribute("data-theme");
    if (theme) store.set("loanai-theme", theme);
  }, [theme]);

  const isDark = theme ? theme === "dark" : window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  const run = async (values) => {
    setLoading(true); setError(""); setFieldErrors({});
    try {
      const data = await predict(values);
      setResult(data); setSnapshot({ ...values });
      const entry = { id: Date.now(), ts: new Date().toISOString(), form: values,
        prediction: data.prediction, probability: data.approval_probability };
      const next = [entry, ...history].slice(0, 25);
      setHistory(next); store.set("loanai-history", next);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setResult(null); setError(e.message); setFieldErrors(e.fields || {});
    } finally { setLoading(false); }
  };

  const submit = (e) => { e.preventDefault(); run(form); };
  const reset = () => { setForm(initialForm); setResult(null); setError(""); setFieldErrors({}); };
  const loadFromHistory = (h) => { setForm(h.form); setTab("dashboard"); run(h.form); };

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar-in">
          <div className="brand">
            <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
              <rect width="32" height="32" rx="8" className="brand-bg" />
              <path d="M16 6 6 12v2h20v-2zM8 16v7h3v-7zm6 0v7h4v-7zm7 0v7h3v-7zM6 25v2h20v-2z" className="brand-fg" />
            </svg>
            <span>Loan<b>AI</b></span>
          </div>
          <nav aria-label="Main">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" className={tab === id ? "active" : ""}
                aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>
                {label}
                {id === "history" && history.length > 0 && <span className="count">{history.length}</span>}
              </button>
            ))}
          </nav>
          <button type="button" className="icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle dark mode" title="Toggle dark mode">{isDark ? "☀" : "☾"}</button>
        </div>
      </header>

      <main className="page">
        {tab === "dashboard" && (
          <>
            <div className="intro no-print">
              <h1>Will this loan be approved?</h1>
              <p>Enter applicant details for an explainable decision: confidence, risk, the reasons behind it, and what could change it.</p>
            </div>
            <div className={`dash ${result ? "has-result" : ""}`}>
              <div className="no-print">
                <ApplicantForm form={form} setForm={setForm} errors={fieldErrors} loading={loading}
                  onSubmit={submit} onReset={reset} />
                {error && <div className="banner error" role="alert">{error}</div>}
              </div>
              <div ref={resultRef} className="result-col">
                {result ? <ResultPanel result={result} form={snapshot} /> : (
                  <div className="empty">
                    <div className="empty-art" aria-hidden="true">◐</div>
                    <h3>Your result appears here</h3>
                    <p>Fill in the form or pick a sample applicant, then press <b>Predict Loan</b>.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {tab === "insights" && <Insights metrics={metrics} />}
        {tab === "fairness" && <FairnessAudit />}
        {tab === "monitor" && <Monitoring />}
        {tab === "bulk" && <BulkUpload />}
        {tab === "history" && <History items={history} onLoad={loadFromHistory}
          onClear={() => { setHistory([]); store.set("loanai-history", []); }} />}
      </main>
      <footer className="foot no-print">
        LoanAI is a learning project. Predictions are model estimates, not financial advice or real lending decisions.
      </footer>
    </>
  );
}
