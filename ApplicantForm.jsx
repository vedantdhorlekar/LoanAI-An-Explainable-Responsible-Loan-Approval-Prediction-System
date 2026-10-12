import { FIELD_LABELS, PRESETS, inrShort } from "../format.js";

const money = [
  ["income_annum", "Annual Income"],
  ["loan_amount", "Loan Amount"],
];
const assets = [
  ["residential_assets_value", "Residential Assets"],
  ["commercial_assets_value", "Commercial Assets"],
  ["luxury_assets_value", "Luxury Assets"],
  ["bank_asset_value", "Bank Assets"],
];

function Money({ name, label, form, errors, onChange }) {
  return (
    <label className={`field ${errors[name] ? "has-error" : ""}`}>
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <span className="prefix">₹</span>
        <input type="number" inputMode="numeric" name={name} value={form[name]}
          min={0} step={100000} onChange={onChange} required />
      </span>
      <span className="hint">{errors[name] || inrShort(form[name])}</span>
    </label>
  );
}

export default function ApplicantForm({ form, setForm, errors, loading, onSubmit, onReset }) {
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const cibil = Number(form.cibil_score) || 300;
  const band = cibil >= 750 ? "Excellent" : cibil >= 700 ? "Good" : cibil >= 600 ? "Fair" : "Poor";

  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <div className="panel-head">
        <h2>Applicant Information</h2>
        <div className="presets" role="group" aria-label="Load a sample applicant">
          {Object.keys(PRESETS).map((k) => (
            <button type="button" key={k} className="chip-btn" onClick={() => setForm({ ...PRESETS[k] })}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <fieldset>
        <legend>Personal</legend>
        <div className="grid three">
          <label className={`field ${errors.education ? "has-error" : ""}`}>
            <span className="field-label">Education</span>
            <select name="education" value={form.education} onChange={onChange}>
              <option>Graduate</option>
              <option>Not Graduate</option>
            </select>
          </label>
          <label className={`field ${errors.self_employed ? "has-error" : ""}`}>
            <span className="field-label">Employment</span>
            <select name="self_employed" value={form.self_employed} onChange={onChange}>
              <option value="No">Salaried</option>
              <option value="Yes">Self-employed</option>
            </select>
          </label>
          <label className={`field ${errors.no_of_dependents ? "has-error" : ""}`}>
            <span className="field-label">Dependents</span>
            <input type="number" name="no_of_dependents" value={form.no_of_dependents}
              min={0} max={10} onChange={onChange} required />
            <span className="hint">{errors.no_of_dependents || "0 – 10"}</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Financials</legend>
        <div className="grid two">
          {money.map(([n, l]) => (
            <Money key={n} name={n} label={l} form={form} errors={errors} onChange={onChange} />
          ))}
          <label className={`field ${errors.loan_term ? "has-error" : ""}`}>
            <span className="field-label">Loan Term (years)</span>
            <input type="number" name="loan_term" value={form.loan_term} min={1} max={30}
              onChange={onChange} required />
            <span className="hint">{errors.loan_term || "1 – 30 years"}</span>
          </label>
          <label className={`field ${errors.cibil_score ? "has-error" : ""}`}>
            <span className="field-label">
              CIBIL Score <b className="band">{cibil} · {band}</b>
            </span>
            <input type="range" name="cibil_score" min={300} max={900} step={10}
              value={cibil} onChange={onChange} className="slider" aria-label="CIBIL score" />
            <span className="hint">{errors.cibil_score || "300 (low) – 900 (high)"}</span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Assets</legend>
        <div className="grid two">
          {assets.map(([n, l]) => (
            <Money key={n} name={n} label={l} form={form} errors={errors} onChange={onChange} />
          ))}
        </div>
      </fieldset>

      <div className="actions">
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Analysing…" : "Predict Loan"}
        </button>
        <button type="button" className="btn ghost" onClick={onReset}>Reset</button>
      </div>
    </form>
  );
}
