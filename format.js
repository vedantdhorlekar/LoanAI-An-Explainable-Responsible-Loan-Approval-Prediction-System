// Indian-style number formatting helpers.
export const inr = (v) =>
  v === "" || v === null || v === undefined || Number.isNaN(Number(v))
    ? "—"
    : "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const inrShort = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (a >= 1e5) return `₹${trim(n / 1e5)} L`;
  return inr(n);
};
const trim = (x) => Number(x.toFixed(2)).toString();

export const pct = (v, d = 1) => `${Number(v).toFixed(d).replace(/\.0+$/, "")}%`;

export const FIELD_LABELS = {
  no_of_dependents: "Dependents",
  income_annum: "Annual Income",
  loan_amount: "Loan Amount",
  loan_term: "Loan Term",
  cibil_score: "CIBIL Score",
  residential_assets_value: "Residential Assets",
  commercial_assets_value: "Commercial Assets",
  luxury_assets_value: "Luxury Assets",
  bank_asset_value: "Bank Assets",
  education: "Education",
  self_employed: "Employment",
};

export const INPUT_COLUMNS = [
  "no_of_dependents", "education", "self_employed", "income_annum", "loan_amount",
  "loan_term", "cibil_score", "residential_assets_value", "commercial_assets_value",
  "luxury_assets_value", "bank_asset_value",
];

export const PRESETS = {
  "Strong applicant": {
    no_of_dependents: 2, education: "Graduate", self_employed: "No",
    income_annum: 9000000, loan_amount: 15000000, loan_term: 12, cibil_score: 790,
    residential_assets_value: 8000000, commercial_assets_value: 5000000,
    luxury_assets_value: 14000000, bank_asset_value: 7000000,
  },
  "Typical applicant": {
    no_of_dependents: 2, education: "Graduate", self_employed: "No",
    income_annum: 5000000, loan_amount: 15000000, loan_term: 12, cibil_score: 700,
    residential_assets_value: 5000000, commercial_assets_value: 3000000,
    luxury_assets_value: 10000000, bank_asset_value: 4000000,
  },
  "Risky applicant": {
    no_of_dependents: 3, education: "Not Graduate", self_employed: "Yes",
    income_annum: 2000000, loan_amount: 20000000, loan_term: 10, cibil_score: 450,
    residential_assets_value: 500000, commercial_assets_value: 0,
    luxury_assets_value: 1000000, bank_asset_value: 300000,
  },
};

export const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const downloadText = (filename, text, type = "text/csv") => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
