"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { FREE_MONTHLY_SHEET_LIMIT } from "@/lib/plans";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

const PREVIEW_STORAGE_KEY = "reviz-preview-sheet";

type GenerateResponse = {
  success: boolean;
  sheetId?: string | null;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  queued?: boolean;
  mode?: "ai_or_fallback" | "demo";
  data?: GeneratedSheet;
  fiche?: FicheGeneree;
  warning?: string;
  error?: string;
};

type UploadResponse = {
  success: boolean;
  data?: {
    documentId: string | null;
    sourceType: "TEXT" | "PDF" | "IMAGE";
    filename: string | null;
    extractedText: string | null;
  };
  warning?: string;
  error?: string;
};

type QuickAction = {
  label: string;
  accept: string;
  enabled: boolean;
  capture?: "environment";
};

type SubjectOption = {
  value: string;
  label: string;
};

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = "10 Mo";
const MINIMAL_UPLOAD_INPUT_ID = "reviz-minimal-upload-input";
const MINIMAL_CAMERA_INPUT_ID = "reviz-minimal-camera-input";
const hiddenFileInputStyle = {
  position: "absolute" as const,
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap" as const,
  border: 0,
};

const quickActions: QuickAction[] = [
  { label: "Importer un PDF", accept: ".pdf", enabled: true },
  { label: "Importer une image", accept: "image/*", enabled: true },
  { label: "Prendre une photo", accept: "image/*", capture: "environment", enabled: true },
  { label: "Importer un audio", accept: "audio/*", enabled: false },
  { label: "Coller du texte", accept: "", enabled: true },
];

const sampleText = `La photosynthese est le processus par lequel les plantes vertes produisent leur matiere organique. Elles utilisent l'energie lumineuse captee par la chlorophylle, ainsi que l'eau absorbee par les racines et le dioxyde de carbone present dans l'air. Ce mecanisme permet la fabrication de glucose, qui sert de reserve d'energie, et rejette de l'oxygene. La photosynthese a lieu principalement dans les feuilles et joue un role essentiel dans l'equilibre de l'atmosphere et des ecosystemes.`;
const sampleTitle = "La photosynthese";
const OTHER_SUBJECT_VALUE = "__other__";
const subjectOptions: SubjectOption[] = [
  { value: "Maths", label: "📐 Maths" },
  { value: "Physique-Chimie", label: "⚗️ Physique-Chimie" },
  { value: "SVT", label: "🌿 SVT" },
  { value: "Histoire-Géo", label: "🌍 Histoire-Géo" },
  { value: "Français", label: "📖 Français" },
  { value: "Philosophie", label: "🧠 Philosophie" },
  { value: "Anglais", label: "🇬🇧 Anglais" },
  { value: "Langues vivantes", label: "🗣️ Langues vivantes" },
  { value: "SES", label: "📊 SES" },
  { value: "Technologie", label: "💻 Technologie" },
  { value: "Arts / Musique", label: "🎨 Arts / Musique" },
  { value: OTHER_SUBJECT_VALUE, label: "✏️ Autre (précise)" },
];

const heroMetrics = [
  { value: "12 s", label: "pour lancer une fiche" },
  { value: "5 formats", label: "acceptes des le depart" },
  { value: "1 outil", label: "pour importer et reviser" },
];

const featureCards = [
  {
    eyebrow: "Vision",
    title: "Une IA qui pense comme un professeur.",
    copy:
      "Chaque fiche est structuree pour faire comprendre, memoriser et reviser. Resume, schema, image mentale, pieges et flashcards travaillent ensemble.",
  },
  {
    eyebrow: "Formats",
    title: "PDF, photo, image, texte.",
    copy:
      "Tu peux partir d'un support propre ou d'une page de cahier. Reviz transforme le brut en fiche claire, exploitable tout de suite.",
  },
  {
    eyebrow: "Revision",
    title: "Une sortie faite pour retenir.",
    copy:
      "Les fiches ne se contentent pas de resumer. Elles mettent en avant les definitions, les connexions, les confusions frequentes et les rappels visuels.",
  },
];

type HomeGeneratorProps = {
  isAuthenticated: boolean;
  plan: "FREE" | "PREMIUM";
  launchMode?: "file" | "photo";
  minimal?: boolean;
};

export function HomeGenerator({
  isAuthenticated,
  plan,
  launchMode,
  minimal = false,
}: HomeGeneratorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [content, setContent] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [titleHint, setTitleHint] = useState("");
  const [sourceType, setSourceType] = useState("TEXT");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileAccept, setFileAccept] = useState(".pdf,.txt,image/*");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  const resolvedSubject = selectedSubject === OTHER_SUBJECT_VALUE ? customSubject.trim() : selectedSubject;
  const isOtherSubject = selectedSubject === OTHER_SUBJECT_VALUE;
  const isSubjectValid = resolvedSubject.trim().length > 0;
  const isGenerateDisabled = isSubmitting || isUploading || content.trim().length < 80 || !isSubjectValid;

  function formatGenerationError(message: string) {
    if (/429|quota|insufficient_quota|billing/i.test(message)) {
      return "Le compte OpenAI configure localement n'a plus de quota. Reviz peut maintenant basculer en mode demo ; relance la generation une fois.";
    }

    return message;
  }

  async function readApiPayload<T>(response: Response): Promise<T> {
    const raw = await response.text();

    try {
      return JSON.parse(raw) as T;
    } catch {
      const normalized = raw.trim();

      if (/request entity too large|payload too large/i.test(normalized)) {
        throw new Error(`Le fichier est trop lourd pour l'envoi en ligne. Garde-le sous ${MAX_UPLOAD_SIZE_LABEL}.`);
      }

      if (!normalized) {
        throw new Error("Le serveur a renvoye une reponse vide.");
      }

      throw new Error(normalized);
    }
  }

  useEffect(() => {
    if (!launchMode) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (launchMode === "photo") {
        openFilePicker("image/*", "environment");
        return;
      }

      openFilePicker(".pdf,.txt,image/*");
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [launchMode]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError(null);

    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(`Le fichier depasse la limite de ${MAX_UPLOAD_SIZE_LABEL}. Reduis sa taille ou exporte un PDF plus leger.`);
      setStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setStatus("Import du fichier et extraction du texte...");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await readApiPayload<UploadResponse>(response);

      if (!response.ok || !data.success || !data.data) {
        throw new Error(data.error ?? "L'import du fichier a echoue.");
      }

      setContent(data.data.extractedText ?? "");
      setIsActivated(true);
      setTextMode(true);
      setSourceType(data.data.sourceType);
      setDocumentId(data.data.documentId);
      setFileName(data.data.filename);
      setTitleHint((data.data.filename ?? selectedFile.name).replace(/\.[^.]+$/, ""));
      setStatus(data.warning ?? "Texte extrait avec succes. Tu peux maintenant generer la fiche.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Une erreur inattendue est survenue pendant l'import.",
      );
      setStatus(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit() {
    setError(null);
    setStatus("Analyse du contenu et generation de la fiche...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          subject: resolvedSubject,
          titleHint,
          sourceType,
          documentId: documentId ?? undefined,
        }),
      });

      const data = await readApiPayload<GenerateResponse>(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "La generation a echoue.");
      }

      if (data.queued && data.sheetId) {
        setStatus("Generation en cours... Reviz prepare la fiche sans te bloquer.");

        const startedAt = Date.now();
        const timeoutMs = 10 * 60 * 1000;

        while (Date.now() - startedAt < timeoutMs) {
          await new Promise((resolve) => window.setTimeout(resolve, 3000));

          const statusResponse = await fetch(`/api/sheets/${data.sheetId}/status`, { cache: "no-store" });
          const statusData = await statusResponse.json() as {
            success: boolean;
            data?: { id: string; status: string; title: string };
            error?: string;
          };

          if (!statusResponse.ok || !statusData.success || !statusData.data) {
            throw new Error(statusData.error ?? "Impossible de suivre la generation.");
          }

          if (statusData.data.status === "COMPLETED") {
            setStatus("Fiche generee. Redirection vers le resultat...");
            router.push(`/sheet/${data.sheetId}`);
            return;
          }

          if (statusData.data.status === "FAILED") {
            throw new Error(
              statusData.data.title && statusData.data.title !== "Fiche en generation"
                ? statusData.data.title
                : "La generation a echoue.",
            );
          }

          setStatus("Generation en cours... Reviz finalise la fiche.");
        }

        throw new Error("La fiche prend plus de temps que prevu. Reviens dans quelques instants.");
      }

      if (data.sheetId) {
        setStatus(
          data.mode === "demo"
            ? "Fiche generee en mode demo. Redirection vers le resultat..."
            : data.warning
              ? `${data.warning} Redirection vers la fiche sauvegardee...`
              : "Fiche generee. Redirection vers le resultat...",
        );
        router.push(`/sheet/${data.sheetId}`);
        return;
      }

      if (!data.data) {
        throw new Error(data.error ?? "La generation a echoue.");
      }

      const previewPayload = JSON.stringify({
        generated: data.data,
        fiche: data.fiche ?? null,
      });

      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, previewPayload);
      window.localStorage.setItem(PREVIEW_STORAGE_KEY, previewPayload);

      setStatus(data.warning ?? "Fiche generee. Redirection vers l'apercu temporaire...");
      router.push("/sheet/preview");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? formatGenerationError(submissionError.message)
          : "Une erreur inattendue est survenue.",
      );
      setStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openFilePicker(accept: string, capture?: "environment") {
    setIsActivated(true);
    setFileAccept(accept);

    const input = fileInputRef.current;
    if (!input) {
      setError("Le selecteur de fichier n'est pas disponible pour le moment. Recharge la page et reessaie.");
      return;
    }

    input.accept = accept;

    if (capture) {
      input.setAttribute("capture", capture);
    } else {
      input.removeAttribute("capture");
    }

    try {
      if ("showPicker" in input && typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch (pickerError) {
      console.warn("showPicker failed, fallback to click()", pickerError);
    }

    input.click();
  }

  function renderSubjectSelector() {
    return (
      <div className="reviz-subject-selector">
        <p className="reviz-subject-label">C&apos;est pour quelle matière ? 🎯</p>
        <div className="reviz-subject-pills" role="radiogroup" aria-label="Choix de la matière">
          {subjectOptions.map((option) => {
            const isSelected = selectedSubject === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className="reviz-subject-pill"
                data-selected={isSelected}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedSubject(option.value);
                  if (option.value !== OTHER_SUBJECT_VALUE) {
                    setCustomSubject("");
                  }
                }}
                disabled={isSubmitting || isUploading}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="reviz-subject-other" data-open={isOtherSubject}>
          <input
            type="text"
            value={customSubject}
            onChange={(event) => setCustomSubject(event.target.value)}
            placeholder="Ex : NSI, Droit, Cinéma..."
            disabled={!isOtherSubject || isSubmitting || isUploading}
          />
        </div>
      </div>
    );
  }

  if (minimal) {
    return (
      <>
      <input
        id={MINIMAL_UPLOAD_INPUT_ID}
        type="file"
        accept=".pdf,.txt,image/*"
        onChange={(event) => void handleFileChange(event)}
        onClick={() => {
          setIsActivated(true);
          setError(null);
        }}
        style={hiddenFileInputStyle}
        disabled={isUploading || isSubmitting}
      />
      <input
        id={MINIMAL_CAMERA_INPUT_ID}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => void handleFileChange(event)}
        onClick={() => {
          setIsActivated(true);
          setError(null);
        }}
        style={hiddenFileInputStyle}
        disabled={isUploading || isSubmitting}
      />
      <section className="reviz-generator-home">
        <div className="reviz-generator-card">
          <p className="reviz-app-eyebrow">REVIZ AI</p>
          <h1>
            transforme ton cours
            <br />
            en fiche.
          </h1>
          <p className="reviz-generator-support">(PDF, TXT, PNG, JPG, JPEG, WEBP, photo)</p>

          <div className="reviz-generator-illustrations" aria-hidden="true">
            <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
            <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
            <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
          </div>

          <div className="reviz-generator-actions">
            <label
              htmlFor={MINIMAL_UPLOAD_INPUT_ID}
              className="reviz-icon-action"
              style={{ opacity: isUploading || isSubmitting ? 0.55 : 1 }}
              aria-disabled={isUploading || isSubmitting}
            >
              <span className="reviz-icon-action-mark" aria-hidden="true">
                ↓
              </span>
              <span>Importer un fichier</span>
            </label>

            <label
              htmlFor={MINIMAL_CAMERA_INPUT_ID}
              className="reviz-icon-action"
              style={{ opacity: isUploading || isSubmitting ? 0.55 : 1 }}
              aria-disabled={isUploading || isSubmitting}
            >
              <span className="reviz-icon-action-mark" aria-hidden="true">
                ○
              </span>
              <span>Prendre une photo</span>
            </label>
          </div>

          {renderSubjectSelector()}

          <button
            type="button"
            className="btn btn-primary reviz-generate-button"
            onClick={() => void handleSubmit()}
            disabled={isGenerateDisabled}
          >
            {isUploading ? "Extraction..." : isSubmitting ? "Generation..." : "Generer ma fiche"}
          </button>

          {fileName ? <p className="reviz-generator-file">Pret : {fileName}</p> : null}
          {status ? <div className="status-box success">{status}</div> : null}
          {error ? <div className="status-box error">{error}</div> : null}
        </div>
      </section>
      </>
    );
  }

  const composer = (
    <section className={`marketing-composer card${minimal ? " generator-shell" : ""}`}>
      <div className="marketing-composer-head">
        <div>
          <p className="eyebrow">{minimal ? "Generateur" : "Lance une fiche maintenant"}</p>
          <h2>
            {minimal
              ? "Importe un cours et genere une fiche en quelques secondes."
              : "Un seul espace pour importer, structurer et generer."}
          </h2>
        </div>
        <div className="composer-notes composer-notes-marketing">
          <span className="note-chip">
            {!isAuthenticated
              ? "Mode demo actif"
              : plan === "PREMIUM"
                ? "Premium illimite"
                : `${FREE_MONTHLY_SHEET_LIMIT} fiches par mois`}
          </span>
          <span className="note-chip">PDF, image, photo, texte</span>
        </div>
      </div>

      <div className={`composer-surface marketing-composer-surface${minimal ? " generator-surface" : ""}`}>
        <div className="composer-launcher marketing-composer-launcher">
          <button
            type="button"
            className="composer-bar marketing-composer-bar"
            onClick={() => openFilePicker(".pdf,.txt,image/*")}
            disabled={isUploading || isSubmitting}
          >
            <span className="composer-bar-label">
              {fileName ? `Pret : ${fileName}` : "Importer un fichier"}
            </span>
            <span className="composer-bar-action">PDF, image, texte</span>
          </button>

          <button
            type="button"
            className="action-pill action-pill-secondary marketing-photo-button"
            onClick={() => openFilePicker("image/*", "environment")}
            disabled={isUploading || isSubmitting}
          >
            Prendre une photo
          </button>
        </div>

        <div className="composer-subactions marketing-subactions">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="subaction-link"
              onClick={() => {
                if (action.label === "Coller du texte") {
                  setIsActivated(true);
                  setTextMode(true);
                  setSourceType("TEXT");
                  setFileName(null);
                  setDocumentId(null);
                  return;
                }

                if (!action.enabled) {
                  setStatus("L'import audio arrive dans la prochaine version du MVP.");
                  return;
                }

                openFilePicker(action.accept, action.capture);
              }}
              disabled={isUploading || isSubmitting}
            >
              {!action.enabled ? `${action.label} bientot` : action.label}
            </button>
          ))}
        </div>

        <div className="marketing-editor-grid">
          <div className="marketing-editor-panel">
            <div className="field">
              <label htmlFor="titleHint">Titre suggere</label>
              <input
                id="titleHint"
                value={titleHint}
                onChange={(event) => setTitleHint(event.target.value)}
                placeholder="Ex. Les cellules eucaryotes"
              />
            </div>

            <div className="field">
              <label htmlFor="sourceType">Type de source</label>
              <select
                id="sourceType"
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
              >
                <option value="TEXT">Texte</option>
                <option value="PDF">PDF</option>
                <option value="IMAGE">Image</option>
                <option value="DOCX">Word</option>
                <option value="AUDIO">Audio</option>
              </select>
            </div>

            <div className="marketing-proof-panel">
              <p className="marketing-tag">Ce que genere Reviz</p>
              <div className="marketing-proof-list">
                <span>Resume structure</span>
                <span>Schema visuel</span>
                <span>Image mentale</span>
                <span>Pieges frequents</span>
                <span>Flashcards</span>
                <span>Quiz de revision</span>
              </div>
            </div>
          </div>

          <div className="dropzone dropzone-clean marketing-dropzone">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Colle ici ton cours, tes notes, un resume de chapitre ou le texte extrait d'un PDF..."
            />
            <div className="dropzone-meta">
              <span>{fileName ? `Fichier : ${fileName}` : "Texte modifiable avant generation"}</span>
              <span>{content.length} caracteres</span>
            </div>
          </div>
        </div>

        {renderSubjectSelector()}

        <div className="composer-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setIsActivated(true);
              setContent(sampleText);
              setTextMode(true);
              setDocumentId(null);
              setFileName(null);
              setSourceType("TEXT");
              setTitleHint(sampleTitle);
              setSelectedSubject("SVT");
              setCustomSubject("");
            }}
            disabled={isSubmitting || isUploading}
          >
            Voir un exemple
          </button>

          <button
            type="button"
            className="btn btn-primary btn-large"
            onClick={() => void handleSubmit()}
            disabled={isGenerateDisabled}
          >
            {isUploading ? "Extraction..." : isSubmitting ? "Generation..." : "Generer ma fiche"}
          </button>
        </div>
      </div>

      {status ? <div className="status-box success">{status}</div> : null}
      {error ? <div className="status-box error">{error}</div> : null}
    </section>
  );

  return (
    <section className="marketing-home">
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        onChange={(event) => void handleFileChange(event)}
        style={hiddenFileInputStyle}
      />

      {!minimal ? (
        <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="eyebrow">Revision premium par IA</p>
          <h1>Des fiches de revision qui donnent envie d&apos;apprendre.</h1>
          <p className="marketing-lead">
            Importe un cours, une photo ou un PDF. Reviz transforme ton contenu en fiche claire,
            visuelle et memorisable avec schemas, image mentale et revision active.
          </p>

          <div className="marketing-hero-actions">
            <button
              type="button"
              className="btn btn-primary marketing-btn"
              onClick={() => openFilePicker(".pdf,.txt,image/*")}
              disabled={isUploading || isSubmitting}
            >
              Importer un fichier
            </button>
            <button
              type="button"
              className="btn btn-ghost marketing-btn"
              onClick={() => openFilePicker("image/*", "environment")}
              disabled={isUploading || isSubmitting}
            >
              Prendre une photo
            </button>
          </div>

          <div className="marketing-metrics">
            {heroMetrics.map((metric) => (
              <article key={metric.label} className="marketing-metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="marketing-hero-visuals">
          <article className="marketing-visual marketing-visual-main">
            <div className="marketing-visual-image marketing-visual-image-students" />
            <div className="marketing-visual-overlay">
              <span className="marketing-tag">Fiches intelligentes</span>
              <h2>Une experience ultra visuelle, du cours brut a la revision active.</h2>
            </div>
          </article>

          <div className="marketing-visual-stack">
            <article className="marketing-visual marketing-visual-mini">
              <div className="marketing-visual-image marketing-visual-image-notes" />
              <div className="marketing-mini-copy">
                <p className="marketing-tag">Photo de cours</p>
                <p>Transforme une page manuscrite en fiche prete a reviser.</p>
              </div>
            </article>

            <article className="marketing-visual marketing-visual-mini marketing-visual-mini-contrast">
              <div className="marketing-mini-panel">
                <p className="marketing-tag">Sortie Reviz</p>
                <ul className="marketing-mini-list">
                  <li>Definition precise</li>
                  <li>Schema memoire</li>
                  <li>Pieges d&apos;examen</li>
                  <li>Flashcards</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>
      ) : null}

      {composer}

      {!minimal ? (
        <>
          <section className="marketing-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="marketing-feature-card">
                <p className="eyebrow">{card.eyebrow}</p>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            ))}
          </section>

          <section className="marketing-showcase">
            <article className="marketing-showcase-copy">
              <p className="eyebrow">Pourquoi ca marque mieux</p>
              <h2>Une fiche qui aide a voir, comprendre et retenir.</h2>
              <p>
                Reviz ne livre pas un simple resume. La fiche montre la logique du chapitre, les erreurs
                classiques, les liens entre notions et les reperes visuels qui aident vraiment la memoire.
              </p>
            </article>

            <article className="marketing-showcase-visual">
              <div className="marketing-visual-image marketing-visual-image-library" />
              <div className="marketing-showcase-card">
                <span className="marketing-tag">Mode revision</span>
                <strong>Flashcards, quiz, schemas et image mentale dans la meme fiche.</strong>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}
