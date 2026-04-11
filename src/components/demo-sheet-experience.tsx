"use client";

import { useEffect, useMemo, useState } from "react";

import { FicheRenderer } from "@/components/fiche/FicheRenderer";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
import { demoSheet } from "@/data/demo-sheet";

const DEMO_STEPS = [
  "Analyse du cours...",
  "Extraction des concepts cles...",
  "Generation de la fiche...",
] as const;

export function DemoSheetExperience() {
  const [revealed, setRevealed] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    const startedAt = window.performance.now();

    const intervalId = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt;
      const ratio = Math.min(elapsed / 3000, 1);
      setProgress(Math.round(ratio * 100));

      if (elapsed >= 1000 && elapsed < 2000) {
        setCurrentStepIndex(1);
      } else if (elapsed >= 2000) {
        setCurrentStepIndex(2);
      }

      if (elapsed >= 3000) {
        setRevealed(true);
        window.clearInterval(intervalId);
      }
    }, 80);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentStep = useMemo(() => DEMO_STEPS[currentStepIndex] ?? DEMO_STEPS[0], [currentStepIndex]);

  async function handleCheckout() {
    try {
      setCheckoutLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de lancer Stripe.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe checkout failed.", error);
      setCheckoutLoading(false);
      window.alert("Impossible de lancer le paiement pour le moment.");
    }
  }

  if (!revealed) {
    return (
      <section
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
          border: "1px solid rgba(5,5,5,0.08)",
          borderRadius: "28px",
          background: "#ffffff",
          boxShadow: "0 24px 70px rgba(0,0,0,0.05)",
          padding: "2.25rem 1.5rem",
          display: "grid",
          gap: "1.2rem",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
          <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
          <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
        </div>

        <div>
          <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>Mode demo</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 0.96 }}>
            Reviz genere une fiche exemple
          </h1>
        </div>

        <div
          style={{
            width: "min(420px, 100%)",
            height: "10px",
            borderRadius: "999px",
            background: "#e5e7eb",
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "999px",
              background: "#2f5bff",
              transition: "width 120ms linear",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: "0.55rem", width: "min(520px, 100%)" }}>
          {DEMO_STEPS.map((step, index) => {
            const isDone = index < currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <div
                key={step}
                style={{
                  minHeight: "52px",
                  borderRadius: "18px",
                  border: `1px solid ${isActive || isDone ? "#2f5bff" : "#e5e7eb"}`,
                  background: isActive ? "#eef4ff" : "#ffffff",
                  color: isDone ? "#1736b6" : "#111827",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "0 1rem",
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span>{step}</span>
                <span aria-hidden="true">
                  {isDone ? "OK" : isActive ? "..." : "."}
                </span>
              </div>
            );
          })}
        </div>

        <p style={{ margin: 0, color: "#6b7280" }}>{currentStep}</p>
      </section>
    );
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <section
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
        }}
      >
        <FicheRenderer fiche={demoSheet} />
      </section>

      <section
        style={{
          width: "min(980px, 100%)",
          margin: "0 auto",
          border: "1px solid #2A2A38",
          borderRadius: "24px",
          background: "#1E1E2A",
          padding: "1.6rem 1.4rem",
          display: "grid",
          gap: "14px",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
            Tu veux tes propres fiches ?
          </strong>
        </div>

        <button
          type="button"
          onClick={() => void handleCheckout()}
          disabled={checkoutLoading}
          style={{
            background: "#3B5BDB",
            borderRadius: "50px",
            padding: "16px 48px",
            fontSize: "15px",
            fontWeight: 700,
            boxShadow: "0 0 32px rgba(59,91,219,0.4)",
            border: "none",
            color: "#FFFFFF",
            cursor: checkoutLoading ? "wait" : "pointer",
          }}
        >
          {checkoutLoading ? "Redirection..." : "Passer Premium — 4,99€/mois"}
        </button>
      </section>
    </div>
  );
}
