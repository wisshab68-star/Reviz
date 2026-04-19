import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
} from "remotion";
import { loadFont as loadBaloo } from "@remotion/google-fonts/Baloo2";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";

const { fontFamily: BALOO } = loadBaloo();
const { fontFamily: CAVEAT } = loadCaveat();

// ─── Design tokens Reviz réels ─────────────────────────────────────────────
const BG = "#FFFFFF";
const INK = "#050505";
const BLUE = "#2F5BFF";
const BLUE_SOFT = "#EAF0FF";
const BLUE_DEEP = "#1736B6";
const YELLOW = "#FFE222";
const MUTED = "#6A6A6A";

// ─── Helpers animation ─────────────────────────────────────────────────────

function useSpring(frame: number, delay = 0, stiffness = 180, damping = 18) {
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { stiffness, damping } });
}

function useFade(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
}

function useSlide(frame: number, delay = 0, distance = 60) {
  const s = useSpring(frame, delay, 200, 20);
  return interpolate(s, [0, 1], [distance, 0]);
}

// ─── Composants UI Reviz ───────────────────────────────────────────────────

// Carte brutaliste signature Reviz
function Card({
  children,
  style = {},
  shadow = true,
  color = BG,
  borderColor = INK,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  shadow?: boolean;
  color?: string;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: color,
      border: `3px solid ${borderColor}`,
      borderRadius: 32,
      boxShadow: shadow ? `10px 10px 0 ${borderColor}` : "none",
      padding: "32px 36px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// Badge pastille bleue
function Pill({ children }: { children: string }) {
  return (
    <div style={{
      display: "inline-block",
      background: BLUE_SOFT,
      border: `2px solid ${BLUE}`,
      borderRadius: 999,
      padding: "8px 24px",
      fontFamily: BALOO,
      fontSize: 24,
      fontWeight: 800,
      color: BLUE_DEEP,
      letterSpacing: "-0.02em",
    }}>
      {children}
    </div>
  );
}

// Texte Caveat manuscrit
function Handwritten({ children, size = 48, color = BLUE, style = {} }: {
  children: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span style={{
      fontFamily: CAVEAT,
      fontSize: size,
      fontWeight: 700,
      color,
      ...style,
    }}>
      {children}
    </span>
  );
}

// Lignes de cahier en fond
function NotebookLines({ count = 12, color = BLUE }: { count?: number; color?: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: 120 + i * 100,
          left: 0, right: 0,
          height: 1.5,
          background: color,
          opacity: 0.06,
        }} />
      ))}
      {/* Marge rouge verticale */}
      <div style={{
        position: "absolute",
        top: 0, bottom: 0,
        left: 80,
        width: 2,
        background: "#FF6B6B",
        opacity: 0.15,
      }} />
    </div>
  );
}

// ─── SCÈNE 1 : Hook (0→90f = 3s) ──────────────────────────────────────────

function SceneHook() {
  const frame = useCurrentFrame();

  const s2 = useSpring(frame, 18, 240, 18);
  const s3 = useSpring(frame, 36, 220, 20);

  // Effet tampon sur le "6" — apparaît avec un léger rebond
  const stampScale = interpolate(useSpring(frame, 0, 400, 10), [0, 1], [2.5, 1]);
  const stampOpacity = useSpring(frame, 0, 300, 12);

  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
      <NotebookLines />

      {/* Grand numéro tamponné */}
      <div style={{
        fontFamily: BALOO,
        fontSize: 380,
        fontWeight: 800,
        color: BLUE,
        lineHeight: 0.8,
        letterSpacing: "-0.08em",
        transform: `scale(${stampScale})`,
        opacity: stampOpacity,
        position: "relative",
      }}>
        6
        {/* Annotation manuscrite sur le chiffre */}
        <div style={{
          position: "absolute",
          top: 60,
          right: -120,
          transform: "rotate(12deg)",
          opacity: s3,
        }}>
          <Handwritten size={52} color="#FF4F6A">semaines !</Handwritten>
        </div>
      </div>

      <div style={{
        textAlign: "center",
        transform: `translateY(${interpolate(s2, [0, 1], [50, 0])}px)`,
        opacity: s2,
        padding: "0 100px",
      }}>
        <div style={{
          fontFamily: BALOO,
          fontSize: 72,
          fontWeight: 800,
          color: INK,
          letterSpacing: "-0.05em",
          lineHeight: 1,
        }}>
          avant le bac.
        </div>
      </div>

      <div style={{
        transform: `translateY(${interpolate(s3, [0, 1], [30, 0])}px)`,
        opacity: s3,
      }}>
        <Pill>T'as encore rien révisé ?</Pill>
      </div>
    </AbsoluteFill>
  );
}

// ─── SCÈNE 2 : Problème (90→240f = 5s) ────────────────────────────────────

function SceneProblem() {
  const frame = useCurrentFrame();

  // Pages de cours qui s'empilent — springs pré-calculés
  const pages = [
    { rotate: -14, bg: BG },
    { rotate: -6, bg: "#F8F9FF" },
    { rotate: 3, bg: BG },
    { rotate: 11, bg: "#F8F9FF" },
    { rotate: 18, bg: BG },
  ];
  const sp0 = useSpring(frame, 0,  140, 14);
  const sp1 = useSpring(frame, 8,  140, 14);
  const sp2 = useSpring(frame, 16, 140, 14);
  const sp3 = useSpring(frame, 24, 140, 14);
  const sp4 = useSpring(frame, 32, 140, 14);
  const pageSprings = [sp0, sp1, sp2, sp3, sp4];

  const fadeMsg = useFade(frame, 40, 60);
  const slideMsg = useSlide(frame, 40);
  const fadeSub = useFade(frame, 70, 90);
  const fadeSos = useFade(frame, 60, 80);

  return (
    <AbsoluteFill style={{ background: "#F5F5F5", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 56 }}>
      <NotebookLines />

      {/* Stack de feuilles */}
      <div style={{ position: "relative", width: 520, height: 480 }}>
        {pages.map((p, i) => {
          const s = pageSprings[i];
          return (
            <div key={i} style={{
              position: "absolute",
              top: interpolate(s, [0, 1], [-350, 0 + i * 10]),
              left: "50%",
              transform: `translateX(-50%) rotate(${interpolate(s, [0, 1], [p.rotate - 20, p.rotate])}deg)`,
              opacity: interpolate(s, [0, 1], [0, 1 - i * 0.12]),
              width: 340, height: 440,
              background: p.bg,
              borderRadius: 16,
              border: `2px solid rgba(5,5,5,${0.15 - i * 0.02})`,
              boxShadow: `${4 - i}px ${4 - i}px 0 rgba(5,5,5,0.08)`,
              padding: "28px 24px",
            }}>
              {/* Titre de page simulé */}
              <div style={{ height: 14, background: BLUE, borderRadius: 4, width: "55%", marginBottom: 20, opacity: 0.6 }} />
              {[...Array(9)].map((_, j) => (
                <div key={j} style={{
                  height: 10, borderRadius: 3, marginBottom: 14,
                  background: INK,
                  opacity: 0.06 + (j % 3) * 0.02,
                  width: `${55 + (j * 17) % 40}%`,
                }} />
              ))}
            </div>
          );
        })}

        {/* Annotation "sos" manuscrite sur la pile */}
        <div style={{
          position: "absolute",
          bottom: -30, right: 20,
          transform: "rotate(-8deg)",
          opacity: fadeSos,
        }}>
          <Handwritten size={56} color="#FF4F6A" style={{ lineHeight: 1 }}>
            trop long... 😭
          </Handwritten>
        </div>
      </div>

      {/* Message */}
      <div style={{ textAlign: "center", padding: "0 80px" }}>
        <div style={{
          fontFamily: BALOO,
          fontSize: 52,
          fontWeight: 800,
          color: INK,
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          opacity: fadeMsg,
          transform: `translateY(${slideMsg}px)`,
        }}>
          Des heures à faire<br />des fiches à la main.
        </div>
        <div style={{
          fontFamily: BALOO,
          fontSize: 38,
          fontWeight: 700,
          color: MUTED,
          letterSpacing: "-0.03em",
          marginTop: 16,
          opacity: fadeSub,
        }}>
          Et si l'IA le faisait pour toi ?
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── SCÈNE 3 : Logo Reveal (240→360f = 4s) ────────────────────────────────

function SceneLogo() {
  const frame = useCurrentFrame();
  const s = useSpring(frame, 5, 200, 14);
  const s2 = useSpring(frame, 28, 180, 18);
  const s3 = useSpring(frame, 50, 160, 20);

  return (
    <AbsoluteFill style={{ background: BG, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
      <NotebookLines />

      {/* Gros tampon REVIZ */}
      <div style={{
        transform: `scale(${interpolate(s, [0, 1], [0.5, 1])}) rotate(${interpolate(s, [0, 1], [-6, 0])}deg)`,
        opacity: s,
      }}>
        <Card shadow color={BLUE} borderColor={INK} style={{ padding: "28px 64px", borderRadius: 40 }}>
          <div style={{
            fontFamily: BALOO,
            fontSize: 140,
            fontWeight: 800,
            color: BG,
            letterSpacing: "-0.08em",
            lineHeight: 0.85,
          }}>
            REVIZ.
          </div>
        </Card>
      </div>

      {/* Tagline Caveat */}
      <div style={{
        transform: `translateY(${interpolate(s2, [0, 1], [30, 0])}px) rotate(-2deg)`,
        opacity: s2,
        textAlign: "center",
      }}>
        <Handwritten size={58} color={INK}>
          Tes fiches en moins d'1 minute.
        </Handwritten>
      </div>

      {/* Message clé */}
      <div style={{
        opacity: s3,
        transform: `translateY(${interpolate(s3, [0, 1], [20, 0])}px)`,
        textAlign: "center",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{
          background: YELLOW,
          border: `3px solid ${INK}`,
          borderRadius: 999,
          padding: "12px 36px",
          display: "inline-block",
          boxShadow: `5px 5px 0 ${INK}`,
        }}>
          <span style={{ fontFamily: BALOO, fontSize: 30, fontWeight: 800, color: INK, letterSpacing: "-0.03em" }}>
            La meilleure méthode de mémorisation.
          </span>
        </div>
        <div>
          <Handwritten size={36} color={MUTED}>
            Tes fiches en moins d'1 minute.
          </Handwritten>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── SCÈNE 4 : Demo Reviz — slam dynamique (360→720f = 12s) ──────────────

function SceneGeneration() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Slams pour chaque étape ──
  const sSlam0 = spring({ frame: frame - 0,   fps, config: { stiffness: 500, damping: 10 } });
  const sSlam1 = spring({ frame: frame - 60,  fps, config: { stiffness: 500, damping: 10 } });
  const sSlam2 = spring({ frame: frame - 120, fps, config: { stiffness: 500, damping: 10 } });

  // ── Fiche full-page (phase 3) springs ──
  const sFicheReveal = spring({ frame: frame - 182, fps, config: { stiffness: 200, damping: 22 } });
  const sFicheH     = spring({ frame: frame - 190, fps, config: { stiffness: 200, damping: 22 } });
  const sBlock0     = spring({ frame: frame - 200, fps, config: { stiffness: 220, damping: 24 } });
  const sBlock1     = spring({ frame: frame - 215, fps, config: { stiffness: 220, damping: 24 } });
  const sBlock2     = spring({ frame: frame - 230, fps, config: { stiffness: 220, damping: 24 } });
  const sBlock3     = spring({ frame: frame - 245, fps, config: { stiffness: 220, damping: 24 } });
  const sBlock4     = spring({ frame: frame - 260, fps, config: { stiffness: 220, damping: 24 } });

  // Phases : 0=upload, 1=matière, 2=génération, 3=fiche
  const phase = frame < 60 ? 0 : frame < 120 ? 1 : frame < 180 ? 2 : 3;

  // Slam actif
  const slams = [sSlam0, sSlam1, sSlam2];
  const slamIdx = phase < 3 ? phase : 2;
  const slam = slams[slamIdx];
  const slamScale = interpolate(slam, [0, 1], [3.2, 1], { easing: Easing.out(Easing.cubic) });
  const slamOpacity = interpolate(slam, [0, 0.25, 1], [0, 1, 1]);

  const stepBgs = [BLUE, YELLOW, INK];
  const stepTexts = [BG, INK, BG];
  const stepAccents = [YELLOW, BLUE, YELLOW];
  const stepLabels = ["UPLOAD\nTON COURS", "CHOISIS\nTA MATIÈRE", "IA EN\nCOURS..."];
  const stepSubs = ["glisse ton PDF ou prends une photo", "Maths · Histoire · Physique · Philo…", "analyse · structure · génère ta fiche"];
  const rotations = [-2, 3, -1];

  const wobble = Math.sin(frame / 8) * 0.8;

  // Progress bar pour phase génération
  const progressWidth = interpolate(frame, [122, 178], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const loadingLabels = ["Lecture du cours...", "Analyse pédagogique...", "Génération de ta fiche..."];
  const loadingIdx = frame < 140 ? 0 : frame < 162 ? 1 : 2;

  const ficheBlocks = [
    {
      tag: "IMAGE MENTALE", icon: "🧠",
      bg: BLUE_SOFT, border: BLUE, textColor: INK,
      content: "Ton cerveau = un enfant gâté. Il choisit TikTok (dopamine rapide) plutôt que réviser (effort + récompense lointaine). C'est câblé, pas une question de volonté.",
    },
    {
      tag: "CARTE MENTALE", icon: "🗺️",
      bg: YELLOW, border: INK, textColor: INK,
      content: "Pourquoi ? → Peur de l'échec · Manque de sens\nComment ? → Scroll · Ménage · \"encore 5 min\"\nFix → Règle des 2 min · Pomodoro · Micro-tâches",
    },
    {
      tag: "FLASHCARD ⚡", icon: "💥",
      bg: BG, border: INK, textColor: INK,
      content: "Q : C'est quoi le biais du présent ?\nR : On préfère une récompense immédiate (scroll) à une plus grande plus tard (réussir son exam).",
    },
    {
      tag: "PIÈGE CLASSIQUE", icon: "⚠️",
      bg: INK, border: INK, textColor: BG,
      content: "\"Je suis occupé\" ≠ \"J'avance\". Remplir son agenda de petites tâches pour éviter la grosse, c'est de la procrastination déguisée.",
    },
    {
      tag: "MÉTHODE FEYNMAN", icon: "✍️",
      bg: "#F3ECFF", border: "#7C3AED", textColor: INK,
      content: "Explique à un enfant : ton cerveau est paresseux par design — il évite la douleur. Procrastiner, c'est un bug d'usine, pas un défaut de caractère.",
    },
  ];

  return (
    <AbsoluteFill style={{ background: phase < 3 ? stepBgs[slamIdx] : BG, flexDirection: "column" }}>
      <NotebookLines color={phase < 3 ? stepTexts[slamIdx] : BLUE} />

      {/* ── PHASES 0-2 : Slam dynamique ── */}
      {phase < 3 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0 }}>
          {/* Compteur étape */}
          <div style={{
            position: "absolute", top: 64, left: 56,
            fontFamily: BALOO, fontSize: 22, fontWeight: 800,
            color: `${stepTexts[slamIdx]}88`, letterSpacing: "-0.02em",
          }}>
            {slamIdx + 1} / 3
          </div>

          {/* Label "REVIZ.GEN" manuscrit */}
          <div style={{ position: "absolute", top: 56, right: 56, opacity: 0.6 }}>
            <Handwritten size={28} color={stepTexts[slamIdx]}>Génère ta fiche.</Handwritten>
          </div>

          {/* Gros texte qui claque */}
          <div style={{
            transform: `scale(${slamScale}) rotate(${rotations[slamIdx] + wobble}deg)`,
            opacity: slamOpacity,
            textAlign: "center",
            padding: "0 60px",
          }}>
            {/* Badge accent */}
            <div style={{
              display: "inline-block",
              background: stepAccents[slamIdx],
              border: `3px solid ${INK}`,
              borderRadius: 999,
              padding: "8px 28px",
              marginBottom: 24,
              boxShadow: `4px 4px 0 ${INK}`,
            }}>
              <span style={{ fontFamily: BALOO, fontSize: 22, fontWeight: 800, color: INK }}>
                étape {slamIdx + 1}
              </span>
            </div>

            {/* Mot principal GROS */}
            <div style={{
              fontFamily: BALOO,
              fontSize: 148,
              fontWeight: 800,
              color: stepTexts[slamIdx],
              letterSpacing: "-0.07em",
              lineHeight: 0.82,
              whiteSpace: "pre-line",
            }}>
              {stepLabels[slamIdx]}
            </div>

            {/* Sous-titre manuscrit */}
            <div style={{ marginTop: 28 }}>
              <Handwritten size={40} color={stepAccents[slamIdx]}>
                {stepSubs[slamIdx]}
              </Handwritten>
            </div>
          </div>

          {/* Barre de progression pour phase 2 */}
          {slamIdx === 2 && (
            <div style={{
              position: "absolute",
              bottom: 80,
              left: 80, right: 80,
              opacity: interpolate(frame - 122, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}>
              <div style={{ fontFamily: BALOO, fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 10 }}>
                {loadingLabels[loadingIdx]}
              </div>
              <div style={{ height: 14, background: "rgba(255,255,255,0.15)", borderRadius: 999, border: "2px solid rgba(255,255,255,0.3)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressWidth}%`, background: YELLOW, borderRadius: 999, transition: "width 0.1s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <span style={{ fontFamily: BALOO, fontSize: 22, fontWeight: 800, color: YELLOW }}>{Math.round(progressWidth)}%</span>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {/* ── PHASE 3 : Fiche pleine page ── */}
      {phase === 3 && (
        <div style={{
          position: "absolute", inset: 0,
          opacity: sFicheReveal,
          transform: `scale(${interpolate(sFicheReveal, [0, 1], [0.96, 1])})`,
          display: "flex", flexDirection: "column",
          overflowY: "hidden",
        }}>
          {/* Header fiche */}
          <div style={{
            background: BLUE, padding: "52px 52px 36px",
            opacity: sFicheH,
          }}>
            <div style={{
              display: "inline-block",
              background: YELLOW, border: `2px solid ${INK}`,
              borderRadius: 999, padding: "6px 20px",
              fontFamily: BALOO, fontSize: 18, fontWeight: 800, color: INK,
              marginBottom: 14, boxShadow: `3px 3px 0 ${INK}`,
            }}>
              🧬 Psychologie — Tous niveaux
            </div>
            <div style={{
              fontFamily: BALOO, fontSize: 72, fontWeight: 800,
              color: BG, letterSpacing: "-0.06em", lineHeight: 0.9,
            }}>
              Pourquoi on<br />Procrastine
            </div>
            <div style={{ marginTop: 16 }}>
              <Handwritten size={36} color={YELLOW}>aka pourquoi t'es sur TikTok là 👀</Handwritten>
            </div>
          </div>

          {/* Blocs de contenu */}
          <div style={{
            flex: 1, background: "#F5F5F5", padding: "28px 40px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            {ficheBlocks.map((b, i) => {
              const bSprings = [sBlock0, sBlock1, sBlock2, sBlock3, sBlock4];
              const bs = bSprings[i];
              return (
                <div key={i} style={{
                  background: b.bg,
                  border: `3px solid ${b.border}`,
                  borderRadius: 20,
                  padding: "16px 22px",
                  boxShadow: `5px 5px 0 ${b.border}`,
                  transform: `translateX(${interpolate(bs, [0, 1], [i % 2 === 0 ? 100 : -100, 0])}px)`,
                  opacity: bs,
                  display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <span style={{ fontFamily: BALOO, fontSize: 12, fontWeight: 800, color: b.textColor === BG ? YELLOW : BLUE, letterSpacing: "0.08em" }}>
                      {b.tag}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: BALOO, fontSize: 18, fontWeight: 700,
                    color: b.textColor, letterSpacing: "-0.02em",
                    lineHeight: 1.35, whiteSpace: "pre-line",
                  }}>
                    {b.content}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ─── SCÈNE 6 : Méthode Reviz — dynamique (720→930f = 7s) ─────────────────

function SceneNeuro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Outcomes-first : on vend la transformation, pas les features
  const methods = [
    { label: "RETIENS\n5X PLUS", sub: "image mentale · méthode Feynman", bg: BLUE, text: BG, accent: YELLOW },
    { label: "ZÉRO\nNUIT BLANCHE", sub: "flashcards actives · espacées dans le temps", bg: YELLOW, text: INK, accent: BLUE },
    { label: "MÊME\nDE ZÉRO", sub: "carte mentale · structure instantanée", bg: INK, text: BG, accent: YELLOW },
    { label: "LES PIÈGES\nDÉTECTÉS", sub: "erreurs classiques identifiées pour toi", bg: "#FF4F6A", text: BG, accent: YELLOW },
  ];

  // Intro slam (frame 0-30) : titre accroche
  const sIntro = spring({ frame: frame - 0, fps, config: { stiffness: 500, damping: 10 } });

  // Pré-calculer tous les slams — décalés de 30f (après intro)
  const slam0 = spring({ frame: frame - 30,  fps, config: { stiffness: 500, damping: 10 } });
  const slam1 = spring({ frame: frame - 75,  fps, config: { stiffness: 500, damping: 10 } });
  const slam2 = spring({ frame: frame - 120, fps, config: { stiffness: 500, damping: 10 } });
  const slam3 = spring({ frame: frame - 165, fps, config: { stiffness: 500, damping: 10 } });
  const slams = [slam0, slam1, slam2, slam3];

  const isIntro = frame < 30;
  const activeIdx = frame < 75 ? 0 : frame < 120 ? 1 : frame < 165 ? 2 : 3;
  const active = methods[activeIdx];
  const slam = slams[activeIdx];
  const slamScale = interpolate(slam, [0, 1], [3, 1], { easing: Easing.out(Easing.cubic) });
  const slamOpacity = interpolate(slam, [0, 0.3, 1], [0, 1, 1]);

  const introScale = interpolate(sIntro, [0, 1], [3, 1], { easing: Easing.out(Easing.cubic) });
  const introOpacity = interpolate(sIntro, [0, 0.3, 1], [0, 1, 1]);
  const introFadeOut = interpolate(frame, [22, 30], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rotations = [-3, 2, -2, 3];
  const rotation = rotations[activeIdx] ?? 0;
  const wobble = Math.sin(frame / 8) * 0.8;

  const doneCards = methods.slice(0, activeIdx);

  return (
    <AbsoluteFill style={{ background: isIntro ? BG : active.bg, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      <NotebookLines color={isIntro ? BLUE : active.text} />

      {/* ── INTRO : titre accroche ── */}
      {isIntro && (
        <div style={{
          transform: `scale(${introScale})`,
          opacity: introOpacity * introFadeOut,
          textAlign: "center",
          padding: "0 80px",
        }}>
          <div style={{
            display: "inline-block",
            background: YELLOW,
            border: `3px solid ${INK}`,
            borderRadius: 999,
            padding: "10px 32px",
            marginBottom: 28,
            boxShadow: `4px 4px 0 ${INK}`,
          }}>
            <span style={{ fontFamily: BALOO, fontSize: 22, fontWeight: 800, color: INK }}>
              pas juste lire — vraiment retenir
            </span>
          </div>
          <div style={{
            fontFamily: BALOO,
            fontSize: 110,
            fontWeight: 800,
            color: INK,
            letterSpacing: "-0.07em",
            lineHeight: 0.82,
            whiteSpace: "pre-line",
          }}>
            {"CE QUE TU\nVAS VRAIMENT\nRETENIR"}
          </div>
          <div style={{ marginTop: 28 }}>
            <Handwritten size={44} color={BLUE}>grâce à la Méthode Reviz.</Handwritten>
          </div>
        </div>
      )}

      {/* ── MÉTHODES : slams ── */}
      {!isIntro && (
        <>
          {/* Compteur */}
          <div style={{
            position: "absolute", top: 64, left: 56,
            fontFamily: BALOO, fontSize: 22, fontWeight: 800,
            color: `${active.text}88`, letterSpacing: "-0.02em",
          }}>
            {activeIdx + 1} / {methods.length}
          </div>

          {/* Label manuscrit */}
          <div style={{ position: "absolute", top: 56, right: 56, textAlign: "right", opacity: 0.6 }}>
            <Handwritten size={28} color={active.text}>La Méthode Reviz.</Handwritten>
          </div>

          {/* Grand texte central */}
          <div style={{
            transform: `scale(${slamScale}) rotate(${rotation + wobble}deg)`,
            opacity: slamOpacity,
            textAlign: "center",
            padding: "0 60px",
          }}>
            <div style={{
              display: "inline-block",
              background: active.accent,
              border: `3px solid ${INK}`,
              borderRadius: 999,
              padding: "8px 28px",
              marginBottom: 24,
              boxShadow: `4px 4px 0 ${INK}`,
            }}>
              <span style={{ fontFamily: BALOO, fontSize: 22, fontWeight: 800, color: INK }}>
                validé par les neurosciences
              </span>
            </div>

            <div style={{
              fontFamily: BALOO,
              fontSize: 160,
              fontWeight: 800,
              color: active.text,
              letterSpacing: "-0.07em",
              lineHeight: 0.82,
              whiteSpace: "pre-line",
            }}>
              {active.label}
            </div>

            <div style={{ marginTop: 28 }}>
              <Handwritten size={44} color={active.accent}>
                {active.sub}
              </Handwritten>
            </div>
          </div>

          {/* Mini badges méthodes déjà vues */}
          {doneCards.length > 0 && (
            <div style={{
              position: "absolute",
              bottom: 60,
              display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
              padding: "0 40px",
            }}>
              {doneCards.map((d, i) => (
                <div key={i} style={{
                  background: d.bg,
                  border: `2px solid ${INK}`,
                  borderRadius: 999,
                  padding: "8px 18px",
                  boxShadow: `3px 3px 0 ${INK}`,
                  transform: `rotate(${rotations[i] ?? 0}deg)`,
                  opacity: 0.85,
                }}>
                  <span style={{ fontFamily: BALOO, fontSize: 16, fontWeight: 800, color: d.text, whiteSpace: "nowrap" }}>
                    ✓ {d.label.replace("\n", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
}

// ─── SCÈNE 7 : CTA final (930→1110f = 6s) ────────────────────────────────

function SceneCTA() {
  const frame = useCurrentFrame();
  const s1 = useSpring(frame, 0, 180, 14);
  const s2 = useSpring(frame, 18, 160, 16);
  const s3 = useSpring(frame, 36, 200, 20);
  const s4 = useSpring(frame, 54, 180, 20);
  // Pre-compute competitor springs (no hooks in loops)
  const cs0 = useSpring(frame, 22, 200, 22);
  const cs1 = useSpring(frame, 32, 200, 22);
  const cs2 = useSpring(frame, 42, 200, 22);

  const wobble = Math.sin(frame / 12) * 1.5;

  const concurrents = [
    { nom: "Notion AI", prix: "10€/mois", slash: true },
    { nom: "ChatGPT Plus", prix: "20€/mois", slash: true },
    { nom: "REVIZ.", prix: "4,99€/mois", slash: false, winner: true },
  ];
  const csSprings = [cs0, cs1, cs2];

  return (
    <AbsoluteFill style={{ background: BLUE, padding: "70px 56px", flexDirection: "column", gap: 36, justifyContent: "center" }}>
      <NotebookLines color={BG} />

      {/* Logo */}
      <div style={{
        transform: `scale(${interpolate(s1, [0, 1], [0.6, 1])}) rotate(${interpolate(s1, [0, 1], [-3, wobble])}deg)`,
        opacity: s1, alignSelf: "center",
      }}>
        <Card color={BG} borderColor={INK} style={{ padding: "16px 52px", borderRadius: 28 }}>
          <div style={{ fontFamily: BALOO, fontSize: 100, fontWeight: 800, color: BLUE, letterSpacing: "-0.08em", lineHeight: 0.85 }}>
            REVIZ.
          </div>
        </Card>
      </div>

      {/* Tableau comparaison */}
      <div style={{
        opacity: s2,
        transform: `translateY(${interpolate(s2, [0, 1], [30, 0])}px)`,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <Handwritten size={36} color={YELLOW} style={{ marginBottom: 4 }}>
          Le moins cher du marché
        </Handwritten>
        {concurrents.map((c, i) => {
          const cs = csSprings[i];
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: c.winner ? YELLOW : "rgba(255,255,255,0.08)",
              border: `2px solid ${c.winner ? INK : "rgba(255,255,255,0.15)"}`,
              borderRadius: 16, padding: "14px 24px",
              boxShadow: c.winner ? `5px 5px 0 ${INK}` : "none",
              transform: `translateX(${interpolate(cs, [0, 1], [-80, 0])}px)`,
              opacity: cs,
            }}>
              <div style={{
                fontFamily: BALOO, fontSize: c.winner ? 28 : 22, fontWeight: c.winner ? 800 : 700,
                color: c.winner ? INK : "rgba(255,255,255,0.7)", letterSpacing: "-0.03em",
                textDecoration: c.slash ? "line-through" : "none",
              }}>
                {c.nom}
              </div>
              <div style={{
                fontFamily: BALOO, fontSize: c.winner ? 26 : 20, fontWeight: c.winner ? 800 : 600,
                color: c.winner ? INK : c.slash ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)",
                textDecoration: c.slash ? "line-through" : "none",
              }}>
                {c.prix}
              </div>
              {c.winner && <Handwritten size={32} color={BLUE}>← NOUS</Handwritten>}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{
        transform: `scale(${interpolate(s3, [0, 1], [0.85, 1])}) translateY(${interpolate(s3, [0, 1], [30, 0])}px)`,
        opacity: s3, alignSelf: "center",
      }}>
        <div style={{
          background: BG, border: `3px solid ${INK}`,
          borderRadius: 999, padding: "26px 68px",
          boxShadow: `8px 8px 0 ${INK}`,
          fontFamily: BALOO, fontSize: 42, fontWeight: 800,
          color: INK, letterSpacing: "-0.04em", textAlign: "center",
        }}>
          Essaie gratuitement →
        </div>
      </div>

      {/* URL + sans CB */}
      <div style={{ opacity: s4, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontFamily: BALOO, fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
          revizai.app
        </div>
        <Handwritten size={30} color={YELLOW}>sans carte bancaire</Handwritten>
      </div>
    </AbsoluteFill>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────

export const RevizDemo = () => {
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* Scène 1 — Hook : 0→3s */}
      <Sequence from={0} durationInFrames={90}>
        <SceneHook />
      </Sequence>

      {/* Scène 2 — Problème : 3→8s */}
      <Sequence from={90} durationInFrames={150}>
        <SceneProblem />
      </Sequence>

      {/* Scène 3 — Logo : 8→12s */}
      <Sequence from={240} durationInFrames={120}>
        <SceneLogo />
      </Sequence>

      {/* Scène 4 — Demo Reviz : 12→24s */}
      <Sequence from={360} durationInFrames={360}>
        <SceneGeneration />
      </Sequence>

      {/* Scène 5 — Méthode Reviz : 24→31s */}
      <Sequence from={720} durationInFrames={210}>
        <SceneNeuro />
      </Sequence>

      {/* Scène 6 — CTA : 31→37s */}
      <Sequence from={930} durationInFrames={180}>
        <SceneCTA />
      </Sequence>
    </AbsoluteFill>
  );
};
