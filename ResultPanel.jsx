import { useEffect, useRef, useState } from "react";
import { predict } from "../api.js";
import { inr, inrShort, pct } from "../format.js";

/* ---------- small building blocks ---------- */
function Gauge({ value, tone, label }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className={`gauge tone-${tone}`} role="img" aria-label={`${label} ${value}%`}>
      <svg viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} className="gauge-track" />
        <circle cx="65" cy="65" r={r} className="gauge-bar"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 65 65)" />
      </svg>
      <div className="gauge-text"><b>{Math.round(value)}%</b><span>{label}</span></div>
    </div>
  );
}

function CreditMeter({ score, band, percentile }) {
  const left = ((score - 300) / 600) * 100;
  return (
    <div className="stat wide">
      <span className="stat-label">Credit Score</span>
      <div className="stat-value">{score} <small>{band}</small></div>
      <div className="meter" aria-hidden="true">
        <i style={{ left: `${left}%` }} />
      </div>
      <div className="meter-scale"><span>300</span><span>600</span><span>900</span></div>
      <span className="muted tiny">Higher than ~{percentile}% of applicants in the dataset</span>
    </div>
  );
}

function ImpactBars({ impacts }) {
  const top = impacts.filter((d) => Math.abs(d.impact) >= 0.1).slice(0, 7);
  const max = Math.max(...top.map((d) => Math.abs(d.impact)), 1);
  if (!top.length) return <p className="muted">No single feature moved the score noticeably.</p>;
  return (
    <ul className="impact">
      {top.map((d) => (
        <li key={d.feature}>
          <span className="impact-label">{d.label}</span>
          <span className="impact-track">
            <span className="axis" />
            <span className={`impact-bar ${d.impact >= 0 ? "pos" : "neg"}`}
              style={{ width: `${(Math.abs(d.impact) / max) * 50}%`, [d.impact >= 0 ? "left" : "right"]: "50%" }} />
          </span>
          <span className={`impact-num ${d.impact >= 0 ? "pos" : "neg"}`}>
            {d.impact > 0 ? "+" : ""}{d.impact} pts
          </span>
        </li>
      ))}
    </ul>
  );
}

function Reasons({ strengths, concerns }) {
  return (
    <div className="two-col">
      <div>
        <h4>Strengths</h4>
        {strengths.length ? (
          <ul className="reasons">
            {strengths.map((s) => (
              <li key={s.key} className="good"><i>✓</i>{s.text}
                <em className="src">{s.source === "model" ? "model" : "check"}</em></li>
            ))}
          </ul>
        ) : <p className="muted">No standout strengths found.</p>}
      </div>
      <div>
        <h4>Watch-outs</h4>
        {concerns.length ? (
          <ul className="reasons">
            {concerns.map((s) => (
              <li key={s.key} className="warn"><i>⚠</i>{s.text}
                <em className="src">{s.source === "model" ? "model" : "check"}</em></li>
            ))}
          </ul>
        ) : <p className="muted">No major concerns found.</p>}
      </div>
    </div>
  );
}

function RejectionAnalysis({ data }) {
  return (
    <section className="block reject-block">
      <h3>Why was this loan rejected?</h3>
      <p className="muted tiny">Model-based explanation of what weighed most. It is not a real lending decision.</p>
      <div className="two-col">
        <div>
          <h4>Main reasons</h4>
          <ol className="numbered">
            {data.main_reasons.length
              ? data.main_reasons.map((r, i) => <li key={i}>{r}</li>)
              : <li>No single dominant reason; the overall profile scored below the approval cut-off.</li>}
          </ol>
        </div>
        <div>
          <h4>What could help</h4>
          <ul className="reasons">
            {data.suggestions.map((s, i) => <li key={i} className="good"><i>✓</i>{s}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Margin({ w, approved }) {
  if (approved) {
    return (
      <section className="block">
        <h3>Safety margin</h3>
        <div className="stats">
          {w.max_loan && (
            <div className="stat">
              <span className="stat-label">Largest loan still approved</span>
              <div className="stat-value">
                {w.max_loan.capped ? "≥ " : ""}{inrShort(w.max_loan.amount)}
              </div>
              <span className="muted tiny">
                {w.max_loan.headroom_pct > 0 ? `+${w.max_loan.headroom_pct}% above your request` : "no headroom above your request"}
              </span>
            </div>
          )}
          {w.min_cibil && (
            <div className="stat">
              <span className="stat-label">Lowest CIBIL still approved</span>
              <div className="stat-value">{w.min_cibil.score}</div>
              <span className="muted tiny">
                {w.min_cibil.buffer > 0 ? `${w.min_cibil.buffer} points of buffer` : "no buffer"}
              </span>
            </div>
          )}
        </div>
      </section>
    );
  }
  const items = [];
  if (w.cibil_to_approve) items.push(["Raise CIBIL", `+${w.cibil_to_approve.increase} → ${w.cibil_to_approve.score}`, "other details unchanged"]);
  if (w.loan_to_approve) items.push(["Lower the loan", `−${w.loan_to_approve.reduction_pct}% → ${inrShort(w.loan_to_approve.amount)}`, "other details unchanged"]);
  if (w.combined) items.push(["Combined route", `CIBIL ${w.combined.cibil_score} + ${inrShort(w.combined.loan_amount)}`, "smallest mix the model accepts"]);
  return (
    <section className="block">
      <h3>Path to approval</h3>
      {items.length ? (
        <div className="stats">
          {items.map(([a, b, c]) => (
            <div className="stat" key={a}>
              <span className="stat-label">{a}</span>
              <div className="stat-value sm">{b}</div>
              <span className="muted tiny">{c}</span>
            </div>
          ))}
        </div>
      ) : <p className="muted">No simple change flips this decision in the model; several factors would need to improve together.</p>}
    </section>
  );
}

/* ---------- live what-if simulator ---------- */
function WhatIf({ base, result }) {
  const [s, setS] = useState({ cibil_score: Number(base.cibil_score), loan_amount: Number(base.loan_amount), loan_term: Number(base.loan_term) });
  const [sim, setSim] = useState(null);
  const [err, setErr] = useState("");
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    const changed = s.cibil_score !== Number(base.cibil_score) || s.loan_amount !== Number(base.loan_amount) || s.loan_term !== Number(base.loan_term);
    if (!changed) { setSim(null); setErr(""); return; }
    const ctl = new AbortController();
    timer.current = setTimeout(() => {
      predict({ ...base, ...s }, ctl.signal)
        .then((d) => { setSim(d); setErr(""); })
        .catch((e) => { if (e.name !== "AbortError") setErr(e.message); });
    }, 250);
    return () => { clearTimeout(timer.current); ctl.abort(); };
  }, [s, base]);

  const loanMax = Math.max(Number(base.loan_amount) * 2, 1000000);
  const delta = sim ? sim.approval_probability - result.approval_probability : 0;
  const flipped = sim && sim.prediction !== result.prediction;

  return (
    <section className="block whatif no-print">
      <div className="block-head">
        <h3>What-if simulator</h3>
        <button type="button" className="chip-btn" onClick={() => setS({ cibil_score: Number(base.cibil_score), loan_amount: Number(base.loan_amount), loan_term: Number(base.loan_term) })}>Reset</button>
      </div>
      <p className="muted tiny">Drag the sliders to see how the model's answer changes. Nothing is saved.</p>
      <div className="sliders">
        <label>CIBIL score <b>{s.cibil_score}</b>
          <input type="range" min={300} max={900} step={10} value={s.cibil_score}
            onChange={(e) => setS({ ...s, cibil_score: Number(e.target.value) })} />
        </label>
        <label>Loan amount <b>{inrShort(s.loan_amount)}</b>
          <input type="range" min={100000} max={loanMax} step={100000} value={Math.min(s.loan_amount, loanMax)}
            onChange={(e) => setS({ ...s, loan_amount: Number(e.target.value) })} />
        </label>
        <label>Loan term <b>{s.loan_term} yrs</b>
          <input type="range" min={2} max={20} step={1} value={s.loan_term}
            onChange={(e) => setS({ ...s, loan_term: Number(e.target.value) })} />
        </label>
      </div>
      {err && <div className="banner error">{err}</div>}
      <div className={`sim-result ${sim ? (sim.prediction === "Approved" ? "ok" : "bad") : ""}`}>
        {sim ? (
          <>
            <b>{sim.prediction === "Approved" ? "Approved" : "Rejected"}</b>
            <span>{pct(sim.approval_probability)} approval chance</span>
            <span className={delta >= 0 ? "up" : "down"}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} pts vs. current
            </span>
            {flipped && <strong className="flip">Decision changes!</strong>}
          </>
        ) : <span className="muted">Move a slider to simulate a change.</span>}
      </div>
    </section>
  );
}

function Benchmarks({ rows }) {
  return (
    <section className="block">
      <h3>You vs. typical applicants</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Measure</th><th>You</th><th>Typical approved</th><th>Typical rejected</th></tr></thead>
          <tbody>
            {rows.map((b) => {
              const fmt = b.key === "cibil_score" ? (v) => Math.round(v) : inrShort;
              const above = b.you >= b.approved_median;
              return (
                <tr key={b.key}>
                  <td>{b.label}</td>
                  <td><b>{fmt(b.you)}</b> <span className={above ? "up" : "down"}>{above ? "▲" : "▼"}</span></td>
                  <td>{fmt(b.approved_median)}</td>
                  <td>{fmt(b.rejected_median)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- v2.1 research-backed blocks ---------- */
function StressTest({ data, pricing }) {
  const toneOf = { comfortable: "ok", stretched: "mid", unaffordable: "bad" };
  return (
    <section className="block">
      <h3>Interest-rate stress test</h3>
      <p className="muted tiny">Can the EMI still be afforded if rates rise? EMI as a share of monthly income (FOIR); comfortable ≤{data.comfort_foir}%, failing &gt;{data.max_foir}%.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Scenario</th><th>Monthly EMI</th><th>EMI / income</th><th>Status</th></tr></thead>
          <tbody>
            {data.scenarios.map((s) => (
              <tr key={s.label}>
                <td>{s.label}</td>
                <td>{inrShort(s.monthly_emi)}</td>
                <td>{s.foir_pct}%</td>
                <td><span className={`pill ${toneOf[s.status]} small`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`banner ${data.resilient ? "info" : "warn-banner"}`}>{data.headline}</div>
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Risk-based pricing tier</span>
          <div className="stat-value sm">{pricing.tier}</div>
          <span className="muted tiny">Suggested rate band: {pricing.suggested_rate_band}. {pricing.note}</span>
        </div>
      </div>
    </section>
  );
}

function InclusionCard({ data }) {
  const tone = data.band === "Strong" ? "ok" : data.band === "Moderate" ? "mid" : "bad";
  return (
    <section className="block">
      <h3>Alternative affordability score <span className="muted tiny">(financial inclusion)</span></h3>
      <p className="muted tiny">A transparent, ability-to-repay score that ignores credit history — a fair second look for thin-file applicants the CIBIL-driven model may under-serve.</p>
      <div className="stats">
        <div className="stat wide">
          <span className="stat-label">Inclusion score</span>
          <div className="stat-value">{data.score}<small> / 100 · <span className={`pill ${tone} small`}>{data.band}</span></small></div>
          <div className="meter" aria-hidden="true"><i style={{ left: `${data.score}%` }} /></div>
          <span className="muted tiny">{data.thin_file ? `Thin credit file (CIBIL ≤ ${data.thin_file_cibil})` : "Not a thin-file applicant"}</span>
        </div>
      </div>
      <ul className="impact simple">
        {data.components.map((c) => (
          <li key={c.name}>
            <span className="impact-label">{c.name} <span className="muted tiny">×{c.weight}</span></span>
            <span className="impact-track"><span className="impact-bar pos" style={{ width: `${c.score}%`, left: 0 }} /></span>
            <span className="impact-num">{c.score}</span>
          </li>
        ))}
      </ul>
      {data.second_look
        ? <div className="banner info">★ {data.message}</div>
        : <p className="muted tiny">{data.message}</p>}
    </section>
  );
}

function FairnessCheckCard({ data }) {
  const tone = data.verdict === "negligible" ? "ok" : data.verdict === "small" ? "mid" : "bad";
  return (
    <section className="block">
      <h3>Fairness check <span className="muted tiny">(counterfactual)</span></h3>
      <p className="muted tiny">{data.note}</p>
      <div className="chips">
        <span className={`pill ${tone}`}>Reliance on sensitive attributes: {data.verdict}</span>
        <span className="pill neutral">max shift {data.max_shift_pct} pts</span>
      </div>
      <ul className="reasons" style={{ marginTop: ".6rem" }}>
        {data.flips.map((f) => (
          <li key={f.attribute} className={Math.abs(f.delta_pct) >= 5 ? "warn" : "good"}>
            <i>{Math.abs(f.delta_pct) >= 5 ? "⚠" : "✓"}</i>
            {f.attribute === "self_employed" ? "Employment type" : "Education"}: {String(f.from)} → {String(f.to)} changes approval chance by {f.delta_pct > 0 ? "+" : ""}{f.delta_pct} pts
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- main result ---------- */
export default function ResultPanel({ result, form }) {
  const approved = result.prediction === "Approved";
  const tone = approved ? "ok" : "bad";
  const db = result.debt_burden;
  const riskTone = { LOW: "ok", MEDIUM: "mid", HIGH: "bad" }[result.risk.level];
  const burdenTone = { LOW: "ok", MODERATE: "mid", HIGH: "bad" }[db.level];

  return (
    <div className="result" id="result">
      <section className={`verdict tone-${tone}`}>
        <div>
          <span className="eyebrow">Loan decision</span>
          <h2>{approved ? "APPROVED" : "REJECTED"}</h2>
          <div className="chips">
            <span className={`pill ${riskTone}`}>Risk: {result.risk.level}</span>
            <span className="pill neutral">Approval chance {pct(result.approval_probability)}</span>
            <span className="pill neutral">{result.model}</span>
          </div>
          {result.risk.note && <p className="tiny muted">{result.risk.note}</p>}
        </div>
        <Gauge value={result.confidence} tone={tone} label="confidence" />
      </section>

      {result.warnings.map((w, i) => <div className="banner warn" key={i}>⚠ {w}</div>)}

      <section className="block">
        <h3>Snapshot</h3>
        <div className="stats">
          <CreditMeter score={result.credit.score} band={result.credit.band} percentile={result.credit.percentile} />
          <div className="stat"><span className="stat-label">Annual Income</span><div className="stat-value sm">{inr(form.income_annum)}</div></div>
          <div className="stat"><span className="stat-label">Loan Amount</span><div className="stat-value sm">{inr(form.loan_amount)}</div></div>
          <div className="stat">
            <span className="stat-label">Debt / Income risk</span>
            <div className="stat-value sm"><span className={`pill ${burdenTone}`}>{db.level}</span></div>
            <span className="muted tiny">
              Loan = {db.loan_to_income}× income · est. EMI {inrShort(db.monthly_emi)}/mo ({db.emi_to_income_pct}% of income at {db.assumed_rate}% p.a.)
            </span>
          </div>
        </div>
      </section>

      <section className="block">
        <h3>Why this decision?</h3>
        <Reasons strengths={result.strengths} concerns={result.concerns} />
        <p className="tiny muted legend">
          <em className="src">model</em> = measured from the trained model · <em className="src">check</em> = transparent rule of thumb
        </p>
      </section>

      <section className="block">
        <h3>Feature impact</h3>
        <p className="muted tiny">How far each input moved the approval chance compared with typical applicants (percentage points).</p>
        <ImpactBars impacts={result.impacts} />
      </section>

      {!approved && result.rejection_analysis && <RejectionAnalysis data={result.rejection_analysis} />}

      <Margin w={result.what_would_change} approved={approved} />
      <WhatIf key={result.approval_probability + JSON.stringify(form)} base={form} result={result} />

      {result.stress_test && <StressTest data={result.stress_test} pricing={result.pricing} />}
      {result.inclusion && <InclusionCard data={result.inclusion} />}
      {result.fairness_check && <FairnessCheckCard data={result.fairness_check} />}

      <Benchmarks rows={result.benchmarks} />

      <p className="disclaimer">{result.disclaimer}</p>
      <div className="no-print">
        <button type="button" className="btn ghost" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
    </div>
  );
}
