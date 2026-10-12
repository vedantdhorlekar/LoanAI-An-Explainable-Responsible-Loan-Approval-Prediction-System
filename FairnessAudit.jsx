import { useEffect, useState } from "react";
import { getFairness } from "../api.js";

const LABELS = { education: "Education", self_employed: "Employment type", dependents: "Dependents" };

export default function FairnessAudit() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getFairness().then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="panel"><p className="muted">Could not load the fairness audit: {err}</p></div>;
  if (!data) return <div className="panel"><p className="muted">Running the fairness audit… (is the backend running?)</p></div>;

  const groupings = Object.entries(data.audit);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head"><h2>Fairness audit</h2></div>
        <p className="muted">
          Approval rates compared across groups the model should <b>not</b> unfairly rely on. The
          <b> disparate-impact ratio</b> is the lowest group's approval rate divided by the highest.
          By the regulatory <b>80% rule</b>, a ratio below 0.80 flags potential adverse impact.
        </p>
        <p className="muted tiny">Basis: {data.basis}</p>
      </section>

      {groupings.map(([key, g]) => {
        const max = Math.max(...g.groups.map((x) => x.approval_rate), 1);
        return (
          <section className="panel" key={key}>
            <div className="panel-head">
              <h2>{LABELS[key] || key}</h2>
              <span className={`pill ${g.passes_80pct_rule ? "ok" : "bad"} small`}>
                DI ratio {g.disparate_impact_ratio ?? "—"} · {g.passes_80pct_rule ? "passes 80% rule" : "fails 80% rule"}
              </span>
            </div>
            <ul className="impact simple">
              {g.groups.map((x) => (
                <li key={x.group}>
                  <span className="impact-label">{x.group} <span className="muted tiny">(n={x.n.toLocaleString("en-IN")})</span></span>
                  <span className="impact-track"><span className="impact-bar pos" style={{ width: `${(x.approval_rate / max) * 100}%`, left: 0 }} /></span>
                  <span className="impact-num">{x.approval_rate}%</span>
                </li>
              ))}
            </ul>
            <p className="muted tiny">Approval-rate gap between highest and lowest group: {g.gap_pct}%.</p>
          </section>
        );
      })}

      <section className="panel notes">
        <div className="panel-head"><h2>How to read this</h2></div>
        <ul>
          <li>Passing the 80% rule means no measured group is approved far less often than another — the model is not obviously discriminating on these attributes.</li>
          <li>This is a <b>group-level</b> check. The Dashboard also shows a <b>per-applicant</b> fairness counterfactual (what happens if we flip one sensitive attribute).</li>
          <li>The deeper equity concern in this dataset is its heavy reliance on CIBIL score, which can shut out applicants with a thin credit file. The <b>alternative inclusion score</b> on each result is designed to catch exactly those cases.</li>
        </ul>
      </section>
    </div>
  );
}
