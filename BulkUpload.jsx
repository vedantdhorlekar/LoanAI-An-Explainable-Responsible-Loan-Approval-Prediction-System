import { useRef, useState } from "react";
import { uploadBatch } from "../api.js";
import { INPUT_COLUMNS, PRESETS, csvEscape, downloadText } from "../format.js";

export default function BulkUpload() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef();

  const template = () => {
    const rows = Object.values(PRESETS).map((p) => INPUT_COLUMNS.map((c) => csvEscape(p[c])).join(","));
    downloadText("loan_applicants_template.csv", [INPUT_COLUMNS.join(","), ...rows].join("\n"));
  };

  const onFile = async (file) => {
    if (!file) return;
    setBusy(true); setError(""); setData(null);
    try { setData(await uploadBatch(file)); } catch (e) { setError(e.message); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  };

  const exportCsv = () => {
    const cols = [...INPUT_COLUMNS, "approval_probability", "decision", "risk_level"];
    downloadText("loan_predictions.csv",
      [cols.join(","), ...data.rows.map((r) => cols.map((c) => csvEscape(r[c])).join(","))].join("\n"));
  };

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head"><h2>Bulk prediction</h2></div>
        <p className="muted">Upload a CSV with these columns and get a decision for every applicant (up to 500 rows).</p>
        <code className="cols">{INPUT_COLUMNS.join(", ")}</code>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={template}>Download template</button>
          <label className="btn primary file-btn">
            {busy ? "Scoring…" : "Choose CSV file"}
            <input ref={input} type="file" accept=".csv,text/csv" disabled={busy}
              onChange={(e) => onFile(e.target.files[0])} hidden />
          </label>
        </div>
        {error && <div className="banner error">{error}</div>}
      </section>

      {data && (
        <section className="panel">
          <div className="panel-head">
            <h2>Results</h2>
            <button type="button" className="chip-btn" onClick={exportCsv}>Download results CSV</button>
          </div>
          <div className="stats">
            <div className="stat"><span className="stat-label">Scored</span><div className="stat-value sm">{data.summary.scored}</div></div>
            <div className="stat"><span className="stat-label">Approved</span><div className="stat-value sm up">{data.summary.approved}</div></div>
            <div className="stat"><span className="stat-label">Rejected</span><div className="stat-value sm down">{data.summary.rejected}</div></div>
            <div className="stat"><span className="stat-label">Invalid rows</span><div className="stat-value sm">{data.summary.invalid}</div></div>
          </div>
          {data.invalid.length > 0 && (
            <div className="banner warn">
              Skipped rows: {data.invalid.slice(0, 5).map((b) => `line ${b.row} (${Object.keys(b.errors).join(", ")})`).join("; ")}
              {data.invalid.length > 5 && " …"}
            </div>
          )}
          <div className="table-wrap tall">
            <table className="table">
              <thead><tr><th>Line</th><th>Income</th><th>Loan</th><th>CIBIL</th><th>Approval %</th><th>Decision</th><th>Risk</th></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{Number(r.income_annum).toLocaleString("en-IN")}</td>
                    <td>{Number(r.loan_amount).toLocaleString("en-IN")}</td>
                    <td>{r.cibil_score}</td>
                    <td>{r.approval_probability}</td>
                    <td><span className={`pill small ${r.decision === "Approved" ? "ok" : "bad"}`}>{r.decision}</span></td>
                    <td>{r.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
