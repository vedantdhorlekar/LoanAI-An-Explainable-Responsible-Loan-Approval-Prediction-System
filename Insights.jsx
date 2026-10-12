import { FIELD_LABELS } from "../format.js";

const pc = (v) => (v * 100).toFixed(2) + "%";

export default function Insights({ metrics }) {
  if (!metrics) return <div className="panel"><p className="muted">Loading model details… (is the backend running?)</p></div>;
  const names = Object.keys(metrics.results);
  const best = metrics.results[metrics.best_model];
  const cm = best.confusion_matrix;
  const cmMax = Math.max(...cm.flat());
  const imp = metrics.feature_importance.filter((d) => d.importance > 0).slice(0, 8);
  const impMax = Math.max(...imp.map((d) => d.share), 1);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head"><h2>Best model: {metrics.best_model}</h2></div>
        <div className="stats">
          {[["Accuracy", best.accuracy], ["Precision", best.precision], ["Recall", best.recall], ["F1 score", best.f1], ["ROC AUC", best.roc_auc]].map(([l, v]) => (
            <div className="stat" key={l}><span className="stat-label">{l}</span><div className="stat-value sm">{pc(v)}</div></div>
          ))}
        </div>
        <p className="muted tiny">
          Trained on {metrics.train_size.toLocaleString("en-IN")} applicants, tested on {metrics.test_size.toLocaleString("en-IN")} unseen ones.
          Dataset approval rate: {metrics.approval_rate}%.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Model comparison</h2></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th><th>ROC AUC</th><th>5-fold CV acc.</th></tr></thead>
            <tbody>
              {names.map((n) => {
                const r = metrics.results[n];
                return (
                  <tr key={n} className={n === metrics.best_model ? "hl" : ""}>
                    <td>{n}{n === metrics.best_model && <span className="pill ok small">best</span>}</td>
                    <td>{pc(r.accuracy)}</td><td>{pc(r.precision)}</td><td>{pc(r.recall)}</td>
                    <td>{pc(r.f1)}</td><td>{pc(r.roc_auc)}</td>
                    <td>{pc(r.cv_accuracy_mean)} <span className="muted tiny">±{(r.cv_accuracy_std * 100).toFixed(1)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head"><h2>Confusion matrix</h2></div>
          <div className="cm">
            <span /><b>Pred. Rejected</b><b>Pred. Approved</b>
            <b>Actual Rejected</b>
            <div style={{ "--a": cm[0][0] / cmMax }} className="cm-ok">{cm[0][0]}<small>correct</small></div>
            <div style={{ "--a": cm[0][1] / cmMax }} className="cm-bad">{cm[0][1]}<small>wrongly approved</small></div>
            <b>Actual Approved</b>
            <div style={{ "--a": cm[1][0] / cmMax }} className="cm-bad">{cm[1][0]}<small>wrongly rejected</small></div>
            <div style={{ "--a": cm[1][1] / cmMax }} className="cm-ok">{cm[1][1]}<small>correct</small></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>What the model relies on</h2></div>
          <ul className="impact simple">
            {imp.map((d) => (
              <li key={d.feature}>
                <span className="impact-label">{FIELD_LABELS[d.feature]}</span>
                <span className="impact-track"><span className="impact-bar pos" style={{ width: `${(d.share / impMax) * 100}%`, left: 0 }} /></span>
                <span className="impact-num">{d.share}%</span>
              </li>
            ))}
          </ul>
          <p className="muted tiny">Permutation importance on held-out data (share of total).</p>
        </section>
      </div>

      <section className="panel notes">
        <div className="panel-head"><h2>Good to know</h2></div>
        <ul>
          <li>The dataset is a public sample of past applications. Its patterns (especially the dominance of CIBIL score) are what the model learned; they may not reflect any real lender's policy.</li>
          <li>Education and employment type can appear as drivers because they correlate with outcomes in the data. Real-world lending must not rely on that without fairness review.</li>
          <li>"Check" items in a result are simple rules of thumb (EMI estimated at 9% p.a.), shown beside the model so you can tell the two apart.</li>
          <li>Output is for learning and demonstration, not financial advice or a lending decision.</li>
        </ul>
      </section>
    </div>
  );
}
