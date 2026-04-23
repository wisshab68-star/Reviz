"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { FREE_MONTHLY_SHEET_LIMIT } from "@/lib/plans";
import { trackUploadPdfInitiated, trackUploadPdfCompleted } from "@/lib/analytics";
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
  message?: string;
};

type StepResponse = {
  success: boolean;
  sheetId?: string;
  inventoryId?: string;
  status?: "PROCESSING" | "COMPLETED" | "FAILED";
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
const LOADING_MESSAGES = [
  { text: "Lecture de ton cours...", delay: 0 },
  { text: "Identification des points cles...", delay: 6000 },
  { text: "Selection des notions importantes...", delay: 12000 },
  { text: "Redaction de tes flashcards...", delay: 18000 },
  { text: "Mise en forme de ta fiche...", delay: 24000 },
  { text: "Presque pret...", delay: 30000 },
];
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
  { value: "Maths", label: "Maths" },
  { value: "Physique-Chimie", label: "Physique-Chimie" },
  { value: "SVT", label: "SVT" },
  { value: "Histoire-Géo", label: "Histoire-Géo" },
  { value: "Français", label: "Français" },
  { value: "Philosophie", label: "Philosophie" },
  { value: "Anglais", label: "Anglais" },
  { value: "Langues vivantes", label: "Langues vivantes" },
  { value: "SES", label: "SES" },
  { value: "Technologie", label: "Technologie" },
  { value: "Arts / Musique", label: "Arts / Musique" },
  { value: OTHER_SUBJECT_VALUE, label: "Autre (précise)" },
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
  subscriptionStatus?: string | null;
  sheetCount?: number;
  launchMode?: "file" | "photo";
  minimal?: boolean;
  welcomeName?: string | null;
};

export function HomeGenerator({
  isAuthenticated,
  plan,
  subscriptionStatus = null,
  sheetCount = 0,
  launchMode,
  minimal = false,
  welcomeName = null,
}: HomeGeneratorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const minimalUploadInputRef = useRef<HTMLInputElement | null>(null);
  const minimalCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [content, setContent] = useState("");
  const [isActivated, setIsActivated] = useState(false);
  const [textMode, setTextMode] = useState(minimal);
  const [titleHint, setTitleHint] = useState("");
  const [sourceType, setSourceType] = useState("TEXT");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeLabel, setFileSizeLabel] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const isAppendingPhoto = useRef(false);
  const [fileAccept, setFileAccept] = useState(".pdf,.txt,image/*");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]?.text ?? "Lecture de ton cours...");

  const resolvedSubject = selectedSubject === OTHER_SUBJECT_VALUE ? customSubject.trim() : selectedSubject;
  const isOtherSubject = selectedSubject === OTHER_SUBJECT_VALUE;
  const isSubjectValid = resolvedSubject.trim().length > 0;
  const isGenerateDisabled = isSubmitting || isUploading || content.trim().length < 300 || !isSubjectValid;
  const hasUploadedFile = Boolean(fileName);
  const hasDirectText = textMode && !fileName && content.trim().length >= 300;
  const isStepOneDone = hasUploadedFile || hasDirectText;
  const isStepTwoDone = isSubjectValid;
  const currentStep = isStepTwoDone ? 3 : isStepOneDone ? 2 : 1;
  const isSubscriptionActive = subscriptionStatus === "active";
  const hasReachedFreeLimit = isAuthenticated && !isSubscriptionActive && sheetCount >= FREE_MONTHLY_SHEET_LIMIT;

  function formatFileSize(sizeInBytes: number) {
    if (sizeInBytes >= 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} Mo`;
    }

    return `${Math.max(1, Math.round(sizeInBytes / 1024))} Ko`;
  }

  function truncateFileName(name: string) {
    if (name.length <= 30) {
      return name;
    }

    const extensionMatch = name.match(/(\.[^.]+)$/);
    const extension = extensionMatch?.[1] ?? "";
    const base = extension ? name.slice(0, -(extension.length)) : name;
    return `${base.slice(0, Math.max(0, 27 - extension.length))}...${extension}`;
  }

  function clearSelectedFile() {
    setContent("");
    setDocumentId(null);
    setFileName(null);
    setFileSizeLabel(null);
    setTitleHint("");
    setSourceType("TEXT");
    setStatus(null);
    setError(null);
    setIsActivated(false);
    setCapturedPhotos([]);
    isAppendingPhoto.current = false;
    setTextMode(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (minimalUploadInputRef.current) {
      minimalUploadInputRef.current.value = "";
    }

    if (minimalCameraInputRef.current) {
      minimalCameraInputRef.current.value = "";
    }
  }

  function formatGenerationError(message: string) {
    if (/FUNCTION_INVOCATION_TIMEOUT/i.test(message)) {
      return "La génération a pris trop de temps (serveur surchargé). Réessaie dans quelques secondes.";
    }

    if (/timed out|erreur serveur|server error/i.test(message)) {
      return "Le serveur a mis trop de temps à répondre. Réessaie dans quelques secondes.";
    }

    if (/502|503|504/i.test(message)) {
      return "Le serveur est temporairement indisponible. Réessaie dans quelques instants.";
    }

    if (/500/i.test(message)) {
      return `Erreur serveur interne. Réessaie, ou copie-colle le texte directement. (${message})`;
    }

    if (/429|quota|insufficient_quota|billing/i.test(message)) {
      return "Quota Anthropic épuisé. Contacte le support Reviz.";
    }

    return message;
  }

  function normalizeApiError(raw: string) {
    const normalized = raw.trim();

    if (!normalized) {
      return "Le serveur a renvoye une reponse vide.";
    }

    if (/<(?:!DOCTYPE|html|head|body)\b/i.test(normalized)) {
      return "Le serveur a renvoye une page d'erreur au lieu d'une reponse API. Recharge la page et reessaie dans quelques instants.";
    }

    if (/request entity too large|payload too large/i.test(normalized)) {
      return `Le fichier est trop lourd pour l'envoi en ligne. Garde-le sous ${MAX_UPLOAD_SIZE_LABEL}.`;
    }

    return normalized;
  }

  async function readApiPayload<T>(response: Response): Promise<T> {
    const raw = await response.text();

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(normalizeApiError(raw));
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

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingMessage(LOADING_MESSAGES[0]?.text ?? "Lecture de ton cours...");
      return;
    }

    setLoadingMessage(LOADING_MESSAGES[0]?.text ?? "Lecture de ton cours...");
    const timeoutIds = LOADING_MESSAGES.slice(1).map((message) =>
      window.setTimeout(() => setLoadingMessage(message.text), message.delay),
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isSubmitting]);

  async function processSelectedFile(selectedFile: File) {
    setError(null);

    if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(`Le fichier depasse la limite de ${MAX_UPLOAD_SIZE_LABEL}. Reduis sa taille ou exporte un PDF plus leger.`);
      setStatus(null);
      return;
    }

    trackUploadPdfInitiated();
    setStatus("Import du fichier et extraction du texte...");
    setIsUploading(true);
    setIsActivated(true);
    setFileName(selectedFile.name);
    setFileSizeLabel(formatFileSize(selectedFile.size));

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

      const extractedText = data.data.extractedText ?? "";
      const photoName = data.data.filename ?? selectedFile.name;

      if (isAppendingPhoto.current) {
        setContent((prev) => prev + "\n\n---\n\n" + extractedText);
        setCapturedPhotos((prev) => [...prev, photoName]);
      } else {
        setContent(extractedText);
        setTextMode(true);
        setSourceType(data.data.sourceType);
        setDocumentId(data.data.documentId);
        setFileName(photoName);
        setTitleHint(photoName.replace(/\.[^.]+$/, ""));
        setCapturedPhotos([photoName]);
      }
      isAppendingPhoto.current = false;
      trackUploadPdfCompleted(selectedFile.size, resolvedSubject || data.data.sourceType);
      setStatus(data.warning ?? "Texte extrait avec succes. Tu peux maintenant generer la fiche.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Une erreur inattendue est survenue pendant l'import.",
      );
      setStatus(null);
      setContent("");
      setDocumentId(null);
      setTitleHint("");
      setSourceType("TEXT");
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (minimalUploadInputRef.current) {
        minimalUploadInputRef.current.value = "";
      }

      if (minimalCameraInputRef.current) {
        minimalCameraInputRef.current.value = "";
      }
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    await processSelectedFile(selectedFile);
  }

  async function handleSubmit() {
    setError(null);
    setStatus("Preparation de la fiche...");
    setIsSubmitting(true);

    try {
      const normalizedTitleHint = titleHint.trim() || undefined;

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          subject: resolvedSubject,
          titleHint: normalizedTitleHint,
          sourceType,
          documentId: documentId ?? undefined,
        }),
      });

      const data = await readApiPayload<GenerateResponse>(generateResponse);

      if (!generateResponse.ok || !data.success) {
        throw new Error(data.message ?? data.error ?? "La generation a echoue.");
      }

      if (data.queued && data.sheetId) {
        setStatus("Generation de la fiche...");

        const sheetResponse = await fetch("/api/generate/sheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetId: data.sheetId,
          }),
        });

        const sheetData = await readApiPayload<StepResponse>(sheetResponse);

        if (sheetResponse.status === 422 || sheetData.error === "UNPROCESSABLE_FILE") {
          setError("Ton fichier est difficile à lire automatiquement. Essaie un PDF de cours en texte, sans trop d'images. Cette tentative n'a pas été comptée sur ton quota.");
          setStatus(null);
          return;
        }

        if (sheetData.status === "FAILED" || (!sheetResponse.ok && !sheetData.success)) {
          setError("Génération interrompue. Réessaie, ça ne compte pas sur ton quota.");
          setStatus(null);
          return;
        }

        setStatus("Fiche generee. Redirection vers le resultat...");
        router.push(`/sheet/${data.sheetId}`);
        return;
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

  async function handleUpgradeCheckout() {
    try {
      setIsCheckoutLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de lancer le paiement.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      console.error("Stripe checkout failed.", checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Impossible de lancer le paiement pour le moment.",
      );
      setIsCheckoutLoading(false);
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

  function handleUploadZoneDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (isSubmitting || isUploading) {
      return;
    }

    setIsDragActive(true);
  }

  function handleUploadZoneDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
  }

  async function handleUploadZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);

    if (isSubmitting || isUploading) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    await processSelectedFile(droppedFile);
  }

  function renderStepper() {
      const steps = [
        {
          key: "import",
          label: "Écris ou importe",
          done: isStepOneDone,
          active: currentStep === 1,
        },
        {
          key: "subject",
          label: "Choisis la matiere",
          done: isStepTwoDone,
          active: currentStep === 2,
        },
        {
          key: "generate",
          label: "Genere",
          done: false,
          active: currentStep === 3,
        },
    ];

    return (
      <div
        className="reviz-stepper"
        aria-label="Etapes pour generer ta fiche"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3rem",
          margin: "0 auto 20px",
          width: "100%",
          flexWrap: "nowrap",
          overflowX: "visible",
        }}
      >
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="reviz-stepper-segment"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", flex: "1 1 0", justifyContent: "center" }}
          >
            <div
              className={`reviz-step${step.done ? " done" : ""}${step.active ? " active" : ""}`}
              aria-current={step.active ? "step" : undefined}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", opacity: 1, color: "inherit" }}
            >
              <span
                className="step-num"
                aria-hidden="true"
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: "12px",
                  width: "24px",
                  height: "24px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "999px",
                  background: step.active ? "#3B5BDB" : "#1E1E2A",
                  color: "#FFFFFF",
                }}
              >
                {index + 1}
              </span>
              <span
                className="step-label"
                style={{ fontFamily: "var(--display-font)", fontSize: "11px", fontWeight: step.active ? 700 : 500, color: step.active ? "#FFFFFF" : "#6B6B82", whiteSpace: "nowrap" }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div className="step-arrow" aria-hidden="true" style={{ color: "#3B3B52", fontFamily: "var(--display-font)", fontSize: "12px", lineHeight: 1 }}>
                â†’
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  function renderFileConfirmation() {
    if (!fileName) {
      return null;
    }

    return (
      <>
        <div
          className="reviz-file-confirm"
          role="status"
          aria-live="polite"
          style={{
            background: "#252532",
            border: "1px solid #2A2A38",
            color: "#FFFFFF",
            borderRadius: "12px",
          }}
        >
          <span className="confirm-icon" aria-hidden="true">
            ?
          </span>
          <span className="confirm-name">{capturedPhotos.length > 1 ? `${capturedPhotos.length} photos` : truncateFileName(fileName)}</span>
          <span className="confirm-size">{fileSizeLabel ?? ""}</span>
          <button
            type="button"
            className="confirm-remove"
            aria-label="Supprimer"
            onClick={clearSelectedFile}
            disabled={isSubmitting || isUploading}
          >
            ?
          </button>
        </div>

        {capturedPhotos.length > 0 && capturedPhotos.length < 10 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
            <label
              htmlFor={MINIMAL_CAMERA_INPUT_ID}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#1A1A26",
                border: "1px solid #3B5BDB",
                borderRadius: "10px",
                color: "#3B5BDB",
                fontFamily: "var(--display-font)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isUploading || isSubmitting ? "not-allowed" : "pointer",
                opacity: isUploading || isSubmitting ? 0.5 : 1,
              }}
              onClick={() => { isAppendingPhoto.current = true; }}
              aria-disabled={isUploading || isSubmitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Ajouter une photo ({capturedPhotos.length}/10)
            </label>
          </div>
        )}
        {capturedPhotos.length >= 10 && (
          <p style={{ textAlign: "center", color: "#6B6B82", fontSize: "12px", marginTop: "8px" }}>
            Maximum 10 photos atteint
          </p>
        )}
      </>
    );
  }

  function renderSubjectSelector() {
    return (
      <div className="reviz-subject-selector" style={{ display: "grid", gap: "20px", width: "100%", justifyItems: "center" }}>
        <div style={{ borderTop: "1px solid #1E1E2A", marginBottom: 0, width: "100%" }} />
        <div
          className="reviz-subject-pills"
          role="radiogroup"
          aria-label="Choix de la matiere"
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", width: "100%" }}
        >
          {subjectOptions.map((option) => {
            const isSelected = selectedSubject === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`reviz-subject-pill${isSelected ? " selected" : ""}`}
                data-selected={isSelected}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedSubject(option.value);
                  if (option.value !== OTHER_SUBJECT_VALUE) {
                    setCustomSubject("");
                  }
                }}
                disabled={isSubmitting || isUploading}
                style={{
                  fontFamily: "var(--display-font)",
                  background: isSelected ? "#3B5BDB" : "#1E1E2A",
                  border: `1px solid ${isSelected ? "#3B5BDB" : "#2A2A38"}`,
                  color: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  boxShadow: "none",
                  cursor: "pointer",
                }}
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
            style={{
              fontFamily: "var(--display-font)",
              background: "#1E1E2A",
              border: "1px solid #2A2A38",
              color: "#FFFFFF",
              borderRadius: "12px",
            }}
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
        ref={minimalUploadInputRef}
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
        ref={minimalCameraInputRef}
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
      <section
        className="reviz-generator-home"
        style={{
          background: "#0F0F13",
          color: "#FFFFFF",
          width: "100%",
          minHeight: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          className="reviz-generator-shell"
          style={{
            width: "100%",
            justifyContent: "center",
            padding: 0,
            background: "#0F0F13",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
        <div
          className="reviz-generator-card"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
            background: "#0F0F13",
            border: "none",
            boxShadow: "none",
            borderRadius: 0,
            padding: "32px 24px",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            textAlign: "center",
          }}
        >
          {isSubmitting ? (
            <div
              className="reviz-loading-overlay"
              id="reviz-loading"
              style={{ background: "#0F0F13", color: "#FFFFFF", borderRadius: 0, minHeight: "420px" }}
            >
              <div className="loading-progress-bar" aria-hidden="true">
                <div className="loading-progress-fill" id="reviz-progress" />
              </div>
              <p className="loading-message" id="reviz-loading-msg" style={{ color: "#FFFFFF" }}>{loadingMessage}</p>
              <p className="loading-sub" style={{ color: "#8B8B9E" }}>Ca prend environ 30 secondes.</p>
            </div>
          ) : hasReachedFreeLimit ? (
            <div
              style={{
                maxWidth: "480px",
                margin: "0 auto",
                textAlign: "center",
                padding: "48px 24px",
              }}
            >
              <span
                style={{
                  background: "#1E1E2A",
                  border: "1px solid #2A2A38",
                  borderRadius: "50px",
                  padding: "6px 16px",
                  fontSize: "12px",
                  color: "#8B8B9E",
                  display: "inline-block",
                  marginBottom: "24px",
                }}
              >
                {`${Math.min(sheetCount, FREE_MONTHLY_SHEET_LIMIT)}/${FREE_MONTHLY_SHEET_LIMIT} fiche${FREE_MONTHLY_SHEET_LIMIT > 1 ? "s" : ""} utilisee${FREE_MONTHLY_SHEET_LIMIT > 1 ? "s" : ""}`}
              </span>
              <h2
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: "clamp(32px, 5vw, 52px)",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: 1.05,
                  margin: "0 0 16px",
                  whiteSpace: "pre-line",
                }}
              >
                {"Tu es chaud pour réviser —\nne t'arrête pas maintenant."}
              </h2>
              <p
                style={{
                  color: "#8B8B9E",
                  fontSize: "15px",
                  margin: "0 0 32px",
                }}
              >
                4,99€/mois — moins cher qu'un McDo · moins cher que des fiches Bristol
              </p>
              <div
                style={{
                  background: "#1E1E2A",
                  border: "1px solid #3B5BDB",
                  borderRadius: "20px",
                  padding: "28px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginBottom: "24px" }}>
                  <span
                    style={{
                      fontSize: "48px",
                      fontWeight: 900,
                      color: "#FFFFFF",
                    }}
                  >
                    4,99€
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      color: "#8B8B9E",
                      marginLeft: "6px",
                    }}
                  >
                    /mois
                  </span>
                </div>
                <div style={{ display: "grid", gap: "12px", textAlign: "left" }}>
                  {[
                    "Fiches illimitees chaque mois",
                    "Toutes les matieres lycee & college",
                    "Flashcards incluses automatiquement",
                    "Resiliation en 1 clic",
                  ].map((feature) => (
                    <div
                      key={feature}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          color: "#3B5BDB",
                          flex: "0 0 auto",
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleUpgradeCheckout()}
                disabled={isCheckoutLoading}
                style={{
                  background: "#3B5BDB",
                  color: "#FFFFFF",
                  borderRadius: "50px",
                  padding: "16px",
                  width: "100%",
                  fontFamily: "var(--display-font)",
                  fontSize: "16px",
                  fontWeight: 700,
                  boxShadow: "0 0 40px rgba(59,91,219,0.5)",
                  border: "none",
                  cursor: isCheckoutLoading ? "wait" : "pointer",
                }}
              >
                {isCheckoutLoading ? "Redirection..." : "Commencer pour 4,99€/mois"}
              </button>
              <p
                style={{
                  color: "#2A2A38",
                  fontSize: "12px",
                  margin: "12px 0 0",
                }}
              >
                Gratuit · Pas de CB · Annulation en 1 clic
              </p>
              {error ? (
                <div
                  className="status-box error"
                  style={{
                    background: "#252532",
                    color: "#FFFFFF",
                    border: "1px solid #2A2A38",
                    marginTop: "20px",
                  }}
                >
                  {error}
                </div>
              ) : null}
            </div>
          ) : (
            <>
          {welcomeName ? (
            <p
              style={{
                width: "100%",
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#8B8B9E",
                textAlign: "center",
                margin: "0 0 16px",
                letterSpacing: "0.02em",
              }}
            >
              {`Bon retour, ${welcomeName}`}
            </p>
          ) : null}
          <p
            style={{
              fontFamily: "var(--display-font)",
              fontSize: "clamp(48px, 6vw, 80px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              textAlign: "center",
              margin: "0 0 8px 0",
            }}
          >
            <span style={{ color: "#FFFFFF" }}>Transforme ton cours </span>
            <span style={{ color: "#3B5BDB" }}>en fiche.</span>
          </p>
          <p
            style={{
              color: "#8B8B9E",
              fontSize: "15px",
              textAlign: "center",
              margin: "0 0 16px 0",
            }}
          >
            Colle ton cours, ou importe un fichier. Choisis la matière. Génère en 30s.
          </p>

          {renderStepper()}

          <p style={{ fontSize: "13px", color: "#9CA3AF", background: "#1a1a24", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px", lineHeight: "1.5" }}>
            Fonctionne avec : PDF de cours en texte, jusqu'à 15 Mo<br />
            Évite : PDFs avec beaucoup de schémas ou scans flous
          </p>

          <div
            className={`reviz-upload-zone${isDragActive ? " drag-active" : ""}`}
            onDragOver={handleUploadZoneDragOver}
            onDragLeave={handleUploadZoneDragLeave}
            onDrop={(event) => void handleUploadZoneDrop(event)}
            style={{
              background: "#0F0F13",
              border: "none",
              borderRadius: 0,
              padding: "0",
            }}
          >
          <div
            className="reviz-generator-actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <label
              htmlFor={MINIMAL_UPLOAD_INPUT_ID}
              className="reviz-icon-action"
              style={{
                opacity: isUploading || isSubmitting ? 0.55 : 1,
                background: "#3B5BDB",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "none",
                fontFamily: "var(--display-font)",
                minHeight: "unset",
                padding: "18px 36px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "14px",
                fontWeight: 700,
              }}
              aria-disabled={isUploading || isSubmitting}
              onMouseEnter={(event) => {
                if (!isUploading && !isSubmitting) {
                  event.currentTarget.style.background = "#2946c4";
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = "#3B5BDB";
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-flex" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
              <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 700 }}>Importer</span>
            </label>

            <label
              htmlFor={MINIMAL_CAMERA_INPUT_ID}
              className="reviz-icon-action"
              style={{
                opacity: isUploading || isSubmitting ? 0.55 : 1,
                background: "transparent",
                border: "1px solid #2A2A38",
                color: "#8B8B9E",
                borderRadius: "12px",
                boxShadow: "none",
                fontFamily: "var(--display-font)",
                minHeight: "unset",
                padding: "18px 36px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "14px",
                fontWeight: 600,
              }}
              aria-disabled={isUploading || isSubmitting}
              onMouseEnter={(event) => {
                if (!isUploading && !isSubmitting) {
                  event.currentTarget.style.borderColor = "#3B5BDB";
                  event.currentTarget.style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "#2A2A38";
                event.currentTarget.style.color = "#8B8B9E";
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-flex" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <span style={{ color: "currentColor", fontSize: "14px", fontWeight: 600 }}>Photo</span>
            </label>

          </div>

          {/* Textarea pour saisie directe de texte */}
          {textMode && !fileName && (
            <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Colle ici ton cours, tes notes ou un résumé de chapitre..."
                disabled={isSubmitting}
                rows={8}
                style={{
                  width: "100%",
                  background: "#1A1A26",
                  border: "1px solid #2A2A38",
                  borderRadius: "14px",
                  color: "#FFFFFF",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  padding: "16px",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#3B5BDB"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2A2A38"; }}
              />
              {content.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => { setContent(""); }}
                    style={{ background: "none", border: "none", color: "#8B8B9E", fontSize: "12px", cursor: "pointer", padding: 0 }}
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>
          )}

          {renderFileConfirmation()}
          </div>

          <div style={{ padding: 0 }}>
            {renderSubjectSelector()}
          </div>

          <button
            type="button"
            className="btn btn-primary reviz-generate-button"
            onClick={() => void handleSubmit()}
            disabled={isGenerateDisabled}
            title={isGenerateDisabled ? "Selectionne un fichier et une matiere d'abord" : undefined}
            style={{
              background: isGenerateDisabled ? "#1E1E2A" : "#3B5BDB",
              color: isGenerateDisabled ? "#8B8B9E" : "#FFFFFF",
              borderRadius: "50px",
              padding: "16px 0",
              width: "320px",
              fontFamily: "var(--display-font)",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              boxShadow: isGenerateDisabled ? "none" : "0 0 32px rgba(59, 91, 219, 0.35)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: isGenerateDisabled ? "not-allowed" : "pointer",
              display: "block",
              margin: "20px auto 0",
              transition: "all 0.2s",
            }}
            onMouseEnter={(event) => {
              if (!isGenerateDisabled) {
                event.currentTarget.style.background = "#2946c4";
                event.currentTarget.style.boxShadow = "0 0 48px rgba(59, 91, 219, 0.5)";
              }
            }}
            onMouseLeave={(event) => {
              if (!isGenerateDisabled) {
                event.currentTarget.style.background = "#3B5BDB";
                event.currentTarget.style.boxShadow = "0 0 32px rgba(59, 91, 219, 0.35)";
              }
            }}
          >
            {isUploading ? "Extraction..." : "Generer ma fiche"}
          </button>

          {fileName ? <p className="reviz-generator-file" style={{ color: "#8B8B9E" }}>Pret : {fileName}</p> : null}
          {status ? <div className="status-box success" style={{ background: "#252532", color: "#FFFFFF", border: "1px solid #2A2A38" }}>{status}</div> : null}
          {error ? <div className="status-box error" style={{ background: "#252532", color: "#FFFFFF", border: "1px solid #2A2A38" }}>{error}</div> : null}
          </>
          )}
        </div>
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


