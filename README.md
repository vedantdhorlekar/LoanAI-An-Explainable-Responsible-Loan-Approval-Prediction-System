# LoanAI v2.1 - Explainable & Responsible Loan Approval Predictor (Machine Learning + React)

A full-stack project: a scikit-learn model served by Flask, with a React (Vite) dashboard that
explains *why* a loan is approved or rejected. **Version 2.1** adds four research-backed features
that tackle real-world problems other loan predictors ignore: fairness, financial inclusion,
affordability under rate shocks, and model drift.

## What's new in v2.1 (unique, problem-solving features)

| # | Feature | Real-world problem it solves | Where to see it |
|---|---|---|---|
| 1 | **Interest-rate stress test + risk-based pricing** | "Approved today, in default tomorrow." Re-prices the EMI at +1/+2/+3% and flags when it stops being affordable; suggests a risk-based rate band. | Dashboard result |
| 2 | **Alternative affordability (inclusion) score** | The model is ~85% driven by CIBIL, so thin-file applicants are auto-rejected. A transparent ability-to-repay score gives them a fair second look. | Dashboard result |
| 3 | **Per-applicant fairness counterfactual** | Hidden reliance on sensitive attributes. Flips education / employment type with all else fixed and reports the swing. | Dashboard result |
| 4 | **Group fairness audit + concept-drift monitoring** | Discriminatory lending and silent model decay. Approval-rate gaps with the 80% rule, plus PSI drift detection on new batches. | "Fairness Audit" & "Monitoring" tabs |

> These are layered **on top of** every original feature below — nothing was removed. The research
> behind each addition is summarised in [`docs/RESEARCH.md`](docs/RESEARCH.md).

## Features (original)

| Area | What you get |
|---|---|
| Full decision report | Approved/Rejected, confidence gauge, risk level (LOW / MEDIUM / HIGH), credit-score meter, income, loan amount, Debt/Income risk with estimated EMI |
| Why this decision? | Strengths and watch-outs, each tagged **model** (measured from the trained model) or **check** (transparent rule of thumb) |
| Feature impact | Per-applicant bars showing how many percentage points each input moved the approval chance (no extra libraries; works with any model) |
| "Why was my loan rejected?" | Main reasons plus suggestions, worded as model-based explanations, not financial advice |
| Path to approval / safety margin | Smallest CIBIL increase or loan reduction that flips a rejection; for approvals, the largest loan and lowest CIBIL still approved |
| What-if simulator | Sliders for CIBIL, loan amount and term re-score live and show the change |
| You vs. typical applicants | Compare with median approved / rejected applicants from the dataset |
| Model Insights tab | 3-model comparison (accuracy, precision, recall, F1, ROC AUC, 5-fold CV), confusion matrix, feature importance, limitations |
| Bulk Predict | Upload a CSV (up to 500 rows), get decisions and download results; template included |
| History | Last 25 predictions kept in your browser; re-run with one click |
| UX | Sample applicants, Indian number formatting (₹ L / Cr), input validation, dark mode, mobile layout, print/PDF report |

> The dataset is dominated by CIBIL score, so the model mostly learns that. The "check" items (EMI burden at an
> assumed 9% p.a., asset cover) are simple rules shown separately so you can tell them apart from the model.

## Project layout

```
backend/    Flask API + model code
  app.py            REST API (/api/predict, /api/batch, /api/metrics, /api/fairness, /api/drift, /api/health)
  loan_engine.py    validation, explanations, risk, what-if search
  advanced.py       v2.1 features: stress test, inclusion score, fairness, PSI drift
  train_model.py    trains 3 models, saves model.pkl + metrics.json (incl. fairness audit)
  tests/            unit tests (incl. v2.1 feature tests)
  data/             loan_approval_dataset.csv
docs/       RESEARCH.md - the 5 papers behind v2.1
frontend/   React (Vite) UI (adds Fairness Audit + Monitoring tabs)
```

## Run it

You need **Python 3.9+** and **Node.js 18+**. Use two terminals.

### 1. Backend (Terminal 1)
```
cd backend
python -m venv venv
venv\Scripts\activate            # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
python train_model.py            # optional: trains the model (~30 s). app.py does it automatically if missing
python app.py                    # API on http://127.0.0.1:5000
```

### 2. Frontend (Terminal 2)
```
cd frontend
npm install
npm run dev                      # open http://localhost:5173
```

Open **http://localhost:5173**, pick a sample applicant (or type your own), and press **Predict Loan**.

### Run the tests (optional)
```
cd backend
python -m unittest discover -s tests -v
```

## Troubleshooting

- **"Cannot reach the backend"** - start `python app.py` and check it prints port 5000.
- **Port 5000 busy (macOS AirPlay)** - change the port in `backend/app.py` and in `frontend/vite.config.js`.
- **scikit-learn version warning / pickle error** - delete `backend/model.pkl` and run `python train_model.py`.
- **`python` not found** - try `python3`.

## API quick reference

`POST /api/predict` with the 11 fields (`no_of_dependents, education, self_employed, income_annum, loan_amount,
loan_term, cibil_score, residential_assets_value, commercial_assets_value, luxury_assets_value, bank_asset_value`)
returns the decision, probability, risk, impacts, strengths, concerns, rejection analysis and what-if results.
`POST /api/batch` takes a CSV upload (`file` field). `GET /api/metrics` returns model comparison data.
`GET /api/fairness` returns the group fairness audit (approval-rate gaps + 80% rule).
`POST /api/drift` returns the PSI concept-drift report for a demo cohort (`?scenario=stable|shift`) or an uploaded CSV batch.

## Disclaimer

Educational project. Outputs are model estimates trained on a sample dataset, not financial advice or real lending decisions.
