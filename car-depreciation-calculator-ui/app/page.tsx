"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

// ── Constants ────────────────────────────────────────────────────────────────

const FUEL_TYPES = ["Gasoline", "Hybrid", "Diesel", "Plug-In Hybrid", "E85 Flex Fuel", "Others"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Dual Switch", "Overdrive Switch", "Others"];
const ACCIDENT_OPTIONS = ["No", "Yes", "Unknown"];
const CLEAN_TITLE_OPTIONS = ["Yes", "No"];
const MIN_YEAR = 1970;
const MAX_YEAR = 2026;

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  mileage: string;
  fuel_type: string;
  transmission: string;
  accident: string;
  clean_title: string;
  model_year: string;
  selling_price: string;
  selling_year: string;
}

type StepStatus = "idle" | "loading" | "done" | "error";

interface StepState {
  status: StepStatus;
  content: string;
}

interface AllSteps {
  step1: StepState;
  step2: StepState;
  step3: StepState;
  step4: StepState;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      className="spinner-border spinner-border-sm"
      role="status"
      aria-hidden="true"
      style={{ width: "0.85rem", height: "0.85rem" }}
    />
  );
}

interface ResultCardProps {
  stepLabel: string;
  title: string;
  loadingText: string;
  step: StepState;
  isOpen: boolean;
  onToggle: () => void;
}

function ResultCard({ stepLabel, title, loadingText, step, isOpen, onToggle }: ResultCardProps) {
  if (step.status === "idle") return null;

  const canToggle = step.status === "done" || step.status === "error";

  return (
    <div className="mb-3" style={{ border: "1px solid #000" }}>
      {/* Header */}
      <div
        className="d-flex align-items-center justify-content-between px-3 py-2"
        style={{
          cursor: canToggle ? "pointer" : "default",
          userSelect: "none",
          borderBottom: canToggle && isOpen ? "1px solid #dee2e6" : "none",
        }}
        onClick={canToggle ? onToggle : undefined}
        role={canToggle ? "button" : undefined}
        aria-expanded={canToggle ? isOpen : undefined}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
            {stepLabel}
          </span>
          <span className="fw-medium" style={{ fontSize: "0.9rem" }}>{title}</span>
          {step.status === "loading" && <Spinner />}
          {step.status === "done" && (
            <span style={{ fontSize: "0.75rem", color: "#198754" }}>✓</span>
          )}
          {step.status === "error" && (
            <span style={{ fontSize: "0.75rem", color: "#dc3545" }}>✗</span>
          )}
        </div>

        {canToggle && (
          <span style={{ fontSize: "0.7rem", color: "#6c757d" }}>
            {isOpen ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Loading body */}
      {step.status === "loading" && (
        <div className="px-3 py-2 text-secondary" style={{ fontSize: "0.875rem" }}>
          {loadingText}
        </div>
      )}

      {/* Collapsible content */}
      {canToggle && isOpen && (
        <div className="px-3 py-3">
          {step.status === "error" ? (
            <p className="text-danger mb-0" style={{ fontSize: "0.875rem" }}>
              {step.content}
            </p>
          ) : (
            <div style={{ fontSize: "0.9rem", lineHeight: "1.6" }} className="markdown-body">
              <ReactMarkdown>{step.content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── API helpers ──────────────────────────────────────────────────────────────

async function fetchDepreciation(form: FormData): Promise<string> {
  const res = await fetch("/api/depreciation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mileage: parseInt(form.mileage, 10),
      fuel_type: form.fuel_type,
      transmission: form.transmission,
      accident: form.accident,
      clean_title: form.clean_title,
      model_year: parseInt(form.model_year, 10),
      selling_price: parseFloat(form.selling_price),
      selling_year: parseInt(form.selling_year, 10),
    }),
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Depreciation API error (${res.status})`);
  }

  return json.data as string;
}

async function fetchFromRoute(path: string, body?: object): Promise<string> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }

  return json.result as string;
}

// ── Main component ───────────────────────────────────────────────────────────

const INITIAL_STEPS: AllSteps = {
  step1: { status: "idle", content: "" },
  step2: { status: "idle", content: "" },
  step3: { status: "idle", content: "" },
  step4: { status: "idle", content: "" },
};

export default function Home() {
  const [form, setForm] = useState<FormData>({
    mileage: "",
    fuel_type: "Gasoline",
    transmission: "Automatic",
    accident: "No",
    clean_title: "Yes",
    model_year: "",
    selling_price: "",
    selling_year: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AllSteps>(INITIAL_STEPS);
  const [openCards, setOpenCards] = useState<Record<keyof AllSteps, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  function setStep(key: keyof AllSteps, update: Partial<StepState>) {
    setSteps((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));
  }

  function toggleCard(key: keyof AllSteps) {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setSteps(INITIAL_STEPS);
    setOpenCards({ step1: false, step2: false, step3: false, step4: false });

    // ── Step 1: Depreciation forecast ────────────────────────────────────────
    setStep("step1", { status: "loading", content: "" });
    let step1Result: string;
    try {
      step1Result = await fetchDepreciation(form);
      setStep("step1", { status: "done", content: step1Result });
    } catch (err) {
      setStep("step1", { status: "error", content: err instanceof Error ? err.message : String(err) });
      setIsAnalyzing(false);
      return;
    }

    // ── Steps 2 & 3: Run in parallel ─────────────────────────────────────────
    setStep("step2", { status: "loading", content: "" });
    setStep("step3", { status: "loading", content: "" });

    let step2Result = "(unavailable)";
    let step3Result = "(unavailable)";

    await Promise.all([
      fetchFromRoute("/api/policies")
        .then((r) => { step2Result = r; setStep("step2", { status: "done", content: r }); })
        .catch((err) => { setStep("step2", { status: "error", content: err instanceof Error ? err.message : String(err) }); }),

      fetchFromRoute("/api/demands")
        .then((r) => { step3Result = r; setStep("step3", { status: "done", content: r }); })
        .catch((err) => { setStep("step3", { status: "error", content: err instanceof Error ? err.message : String(err) }); }),
    ]);

    // ── Step 4: Final synthesis ───────────────────────────────────────────────
    setStep("step4", { status: "loading", content: "" });
    try {
      const summary = await fetchFromRoute("/api/summary", {
        carInfo: form,
        step1Result,
        step2Result,
        step3Result,
      });
      setStep("step4", { status: "done", content: summary });
    } catch (err) {
      setStep("step4", { status: "error", content: err instanceof Error ? err.message : String(err) });
    }

    setIsAnalyzing(false);
  }

  const hasResults = steps.step1.status !== "idle";

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh", color: "#000" }}>
      <div className="container py-5" style={{ maxWidth: "720px" }}>

        {/* Header */}
        <h1 className="fs-3 fw-semibold mb-1">Car Depreciation Calculator</h1>
        <p className="text-secondary mb-4" style={{ fontSize: "0.9rem" }}>
          Enter your vehicle details to receive a 5-year depreciation forecast combined with
          a real-time market analysis from Claude AI.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="mileage">Current Mileage (miles)</label>
              <input
                type="number" id="mileage" name="mileage" className="form-control"
                placeholder="e.g. 50000" min={0}
                value={form.mileage} onChange={handleChange} disabled={isAnalyzing} required
              />
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="model_year">Model Year</label>
              <input
                type="number" id="model_year" name="model_year" className="form-control"
                placeholder={`${MIN_YEAR}–${MAX_YEAR}`} min={MIN_YEAR} max={MAX_YEAR}
                value={form.model_year} onChange={handleChange} disabled={isAnalyzing} required
              />
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="fuel_type">Fuel Type</label>
              <select id="fuel_type" name="fuel_type" className="form-select"
                value={form.fuel_type} onChange={handleChange} disabled={isAnalyzing}>
                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="transmission">Transmission</label>
              <select id="transmission" name="transmission" className="form-select"
                value={form.transmission} onChange={handleChange} disabled={isAnalyzing}>
                {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="accident">Accident History</label>
              <select id="accident" name="accident" className="form-select"
                value={form.accident} onChange={handleChange} disabled={isAnalyzing}>
                {ACCIDENT_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="clean_title">Clean Title</label>
              <select id="clean_title" name="clean_title" className="form-select"
                value={form.clean_title} onChange={handleChange} disabled={isAnalyzing}>
                {CLEAN_TITLE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="form-text">Not declared a total loss.</div>
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="selling_price">Original Purchase Price (USD)</label>
              <input
                type="number" id="selling_price" name="selling_price" className="form-control"
                placeholder="e.g. 25000" min={0.01} step="0.01"
                value={form.selling_price} onChange={handleChange} disabled={isAnalyzing} required
              />
            </div>

            <div className="col-sm-6">
              <label className="form-label fw-medium" htmlFor="selling_year">Year of Purchase</label>
              <input
                type="number" id="selling_year" name="selling_year" className="form-control"
                placeholder={`${MIN_YEAR}–${MAX_YEAR}`} min={MIN_YEAR} max={MAX_YEAR}
                value={form.selling_year} onChange={handleChange} disabled={isAnalyzing} required
              />
            </div>

          </div>

          <button type="submit" className="btn btn-dark w-100 mt-4" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Analyzing…
              </>
            ) : "Analyze My Car"}
          </button>
        </form>

        {/* Result Cards */}
        {hasResults && (
          <div className="mt-5">
            <hr className="mb-4" />
            <p className="text-secondary mb-3" style={{ fontSize: "0.8rem" }}>
              Click a completed step to expand its results.
            </p>

            <ResultCard
              stepLabel="STEP 1"
              title="Depreciation Forecast"
              loadingText="Fetching 5-year depreciation forecast…"
              step={steps.step1}
              isOpen={openCards.step1}
              onToggle={() => toggleCard("step1")}
            />
            <ResultCard
              stepLabel="STEP 2"
              title="Government Policy Analysis"
              loadingText="Searching for the latest auto market policy news…"
              step={steps.step2}
              isOpen={openCards.step2}
              onToggle={() => toggleCard("step2")}
            />
            <ResultCard
              stepLabel="STEP 3"
              title="Consumer Demand Trends"
              loadingText="Searching for the latest auto market demand trends…"
              step={steps.step3}
              isOpen={openCards.step3}
              onToggle={() => toggleCard("step3")}
            />
            <ResultCard
              stepLabel="STEP 4"
              title="Comprehensive Analysis"
              loadingText="Generating your personalised market analysis…"
              step={steps.step4}
              isOpen={openCards.step4}
              onToggle={() => toggleCard("step4")}
            />
          </div>
        )}

        <p className="text-secondary mt-5" style={{ fontSize: "0.75rem" }}>
          Depreciation model trained on U.S. vehicle data 1974–2024. Market analysis powered by Claude AI with web search.
        </p>
      </div>
    </div>
  );
}
