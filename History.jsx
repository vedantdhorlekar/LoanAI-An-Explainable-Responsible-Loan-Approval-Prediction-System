import { inrShort } from "../format.js";

export default function History({ items, onLoad, onClear }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Recent predictions</h2>
        {items.length > 0 && <button type="button" className="chip-btn" onClick={onClear}>Clear history</button>}
      </div>
      {items.length === 0 ? (
        <p className="muted">Nothing yet. Predictions you run are remembered here (only in this browser).</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>When</th><th>Income</th><th>Loan</th><th>CIBIL</th><th>Decision</th><th>Approval %</th><th /></tr></thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>{inrShort(h.form.income_annum)}</td>
                  <td>{inrShort(h.form.loan_amount)}</td>
                  <td>{h.form.cibil_score}</td>
                  <td><span className={`pill small ${h.prediction === "Approved" ? "ok" : "bad"}`}>{h.prediction}</span></td>
                  <td>{h.probability}</td>
                  <td><button type="button" className="chip-btn" onClick={() => onLoad(h)}>Re-run</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
