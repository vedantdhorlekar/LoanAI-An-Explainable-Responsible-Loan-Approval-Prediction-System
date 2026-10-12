import { useState } from "react";
import { getDrift, uploadDrift } from "../api.js";
import { FIELD_LABELS } from "../format.js";

const STATUS_CLASS = { "stable": "ok", "minor shift": "warn", "significant drift": "bad" };

export default function Monitoring() {
  const [rep, setRep] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const run = async (fn, tag) => {
    setBusy(tag); setErr("");
    try { setRep(await fn()); } catch (e) { setErr(e.message); } finally { setBusy(""); }
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) run(() => uploadDrift(f), "file");
    e.target.value = "";
  };

  const psiMax = rep ? Math.max(0.3, ...rep.features.map((d) => d.psi)) : 1;

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head"><h2>Model monitoring — concept drift</h2></div>
        <p className="muted">
          A model trained once can quietly go stale when the people applying change. This checks how far a
          batch of applications has drifted from the training data using the <b>Population Stability Index (PSI)</b>
          per feature. <b>&lt;0.10</b> stable · <b>0.10–0.25</b> minor shift · <b>&gt;0.25</b> significant drift.
        </p>
        <div className="row gap">
          <button className="btn" disabled={!!busy} onClick={() => run(() => getDrift("stable"), "stable")}>
            {busy === "stable" ? "Running…" : "Simulate a stable quarter"}
          </button>
          <button className="btn primary" disabled={!!busy} onClick={() => run(() => getDrift("shift"), "shift")}>
            {busy === "shift" ? "Running…" : "Simulate a stressed quarter"}
          </button>
          <label className="btn ghost">
            {busy === "file" ? "Reading…" : "Upload a batch (CSV)"}
            <input type="file" accept=".csv" hidden onChange={onFile} />
          </label>
        </div>
        {err && <div className="banner error" role="alert">{err}</div>}
      </section>

      {rep && (
        <section className="panel">
          <div className="panel-head">
            <h2>Result</h2>
            <span className={`pill ${STATUS_CLASS[rep.status]} small`}>{rep.status.toUpperCase()} · max PSI {rep.max_psi}</span>
          </div>
          <p className="muted tiny">Source: {rep.source} · {rep.n_rows?.toLocaleString("en-IN")} applications scored.</p>
          <ul className="impact simple">
            {rep.features.map((d) => (
              <li key={d.feature}>
                <span className="impact-label">{FIELD_LABELS[d.feature] || d.feature}</span>
                <span className="impact-track">
                  <span className={`impact-bar ${d.status === "stable" ? "pos" : "neg"}`}
                    style={{ width: `${Math.min(100, (d.psi / psiMax) * 100)}%`, left: 0 }} />
                </span>
                <span className="impact-num">{d.psi} <span className="muted tiny">{d.status}</span></span>
              </li>
            ))}
          </ul>
          <div className={`banner ${rep.status === "stable" ? "info" : "warn-banner"}`}>{rep.action}</div>
        </section>
      )}

      <section className="panel notes">
        <div className="panel-head"><h2>Why this matters</h2></div>
        <ul>
          <li>The "stressed quarter" demo lowers applicants' CIBIL and raises loan sizes — exactly what happens in a downturn — and the PSI jumps into "significant drift".</li>
          <li>In production you would schedule this check on each new batch and alert the team when drift crosses 0.25, then retrain.</li>
          <li>You can also upload your own CSV (same 11 input columns as Bulk Predict) to monitor a real batch.</li>
        </ul>
      </section>
    </div>
  );
}
