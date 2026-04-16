export const runtime = "nodejs"
export const maxDuration = 60

import { NextRequest, NextResponse } from "next/server"
import { generateWithPipeline } from "@/services/generation-pipeline"
import { db } from "@/lib/db"

const DEMO_RATE_LIMIT = 3
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24h

const SAMPLE_TEXTS: Record<string, string> = {
  "Mathématiques": `Les probabilités permettent de quantifier l'incertitude d'un événement aléatoire. Une expérience aléatoire est une expérience dont on ne peut pas prévoir avec certitude le résultat. L'univers Ω est l'ensemble de tous les résultats possibles. Un événement A est un sous-ensemble de Ω. La probabilité P(A) est un nombre entre 0 et 1. Si les issues sont équiprobables, P(A) = nombre d'issues favorables / nombre d'issues totales. La probabilité de l'événement certain Ω est P(Ω) = 1. La probabilité de l'événement impossible ∅ est P(∅) = 0. L'événement contraire de A, noté Ā, vérifie P(Ā) = 1 - P(A). Pour deux événements incompatibles A et B : P(A ∪ B) = P(A) + P(B). Pour des événements quelconques : P(A ∪ B) = P(A) + P(B) - P(A ∩ B). Les arbres de probabilités permettent de représenter des expériences successives. La loi des grands nombres stipule que la fréquence d'un événement tend vers sa probabilité quand le nombre d'expériences tend vers l'infini.`,
  "Physique-Chimie": `Une réaction chimique est une transformation au cours de laquelle des réactifs se transforment en produits. L'équation de réaction doit être équilibrée : le nombre d'atomes de chaque élément est conservé. La loi de conservation de la masse stipule que la masse totale des réactifs égale la masse totale des produits. Les réactifs et produits sont identifiés par leurs formules chimiques. Le réactif limitant est celui qui est totalement consommé en premier. L'avancement x de la réaction mesure la progression de la transformation. Le taux d'avancement final τ = xf/xmax indique si la réaction est totale (τ = 1) ou non totale (τ < 1). La stoechiométrie permet de calculer les quantités de matière mises en jeu. n = m/M avec n la quantité de matière en mol, m la masse en g, M la masse molaire en g/mol. Pour les gaz à température et pression normales, Vm = 22,4 L/mol.`,
  "SVT": `La photosynthèse est le processus par lequel les végétaux chlorophylliens produisent de la matière organique à partir de matière minérale en utilisant l'énergie lumineuse. Elle se déroule dans les chloroplastes des cellules végétales. L'équation bilan est : 6CO₂ + 6H₂O + énergie lumineuse → C₆H₁₂O₆ + 6O₂. La photosynthèse comprend deux phases : la phase photochimique (dans les thylakoïdes) qui capte l'énergie lumineuse et produit de l'ATP et du NADPH, et la phase de Calvin (dans le stroma) qui utilise cette énergie pour réduire le CO₂ en glucides. Les pigments photosynthétiques (chlorophylle a, b, caroténoïdes) absorbent la lumière dans le rouge et le bleu. La photosynthèse est à la base des chaînes alimentaires et contribue au cycle du carbone.`,
  "Histoire-Géographie": `La Première Guerre mondiale (1914-1918) est un conflit mondial déclenché par l'attentat de Sarajevo le 28 juin 1914, où l'archiduc François-Ferdinand d'Autriche est assassiné. Les alliances européennes entraînent rapidement la plupart des grandes puissances dans le conflit : la Triple Entente (France, Royaume-Uni, Russie) contre la Triple Alliance (Allemagne, Autriche-Hongrie, Empire ottoman). La guerre est caractérisée par une guerre de positions (tranchées) sur le front ouest, une brutalisation des combats, et l'utilisation de nouvelles technologies (gaz, char, avion). Le bilan est catastrophique : 10 millions de morts militaires, 7 millions de civils. Le traité de Versailles (1919) impose des conditions humiliantes à l'Allemagne, semant les germes du second conflit mondial.`,
  "Français": `L'argumentation est l'ensemble des procédés par lesquels un locuteur cherche à convaincre ou à persuader son destinataire. Convaincre fait appel à la raison par des arguments logiques et des preuves. Persuader fait appel aux émotions et aux sentiments. La thèse est la position défendue par l'auteur. Les arguments appuient la thèse. Les exemples illustrent les arguments. Les connecteurs logiques organisent le discours (cause : car, puisque ; conséquence : donc, ainsi ; opposition : mais, cependant ; addition : de plus, en outre). Les figures de style renforcent l'argumentation : la métaphore, l'hyperbole, l'ironie, la répétition. Les principaux types de textes argumentatifs sont l'essai, le discours, l'éditorial, la lettre ouverte et le plaidoyer.`,
  "Philosophie": `La conscience désigne la capacité de l'être humain à se représenter lui-même et le monde qui l'entoure. Descartes, dans les Méditations Métaphysiques, établit le cogito : 'Je pense donc je suis', faisant de la conscience le fondement de toute certitude. La conscience immédiate est la perception directe de nos états mentaux. La conscience réfléchie est le retour de la pensée sur elle-même. Pour Freud, une partie de notre vie psychique échappe à la conscience : l'inconscient contient des désirs refoulés qui influencent notre comportement. L'identité personnelle pose la question de la permanence du moi dans le temps. Locke associe l'identité personnelle à la continuité de la mémoire. La liberté est-elle compatible avec le déterminisme ? Sartre affirme que l'existence précède l'essence : l'homme est condamné à être libre.`,
}

function getSampleText(subject: string): string {
  return SAMPLE_TEXTS[subject] ?? SAMPLE_TEXTS["Mathématiques"]!
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date()

  const record = await db.demoRateLimit.findUnique({ where: { ip } })

  if (!record || now > record.resetAt) {
    // First request or window expired — reset
    await db.demoRateLimit.upsert({
      where: { ip },
      create: { ip, count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
      update: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
    })
    return true
  }

  if (record.count >= DEMO_RATE_LIMIT) {
    return false
  }

  await db.demoRateLimit.update({
    where: { ip },
    data: { count: { increment: 1 } },
  })
  return true
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const allowed = await checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Crée un compte pour générer des fiches illimitées." },
        { status: 429 },
      )
    }

    const body = await req.json() as { subject?: string; level?: string; text?: string }
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const level = typeof body.level === "string" ? body.level.trim() : ""
    const userText = typeof body.text === "string" ? body.text.trim() : ""

    if (!subject || !level) {
      return NextResponse.json(
        { error: "Matière et niveau requis." },
        { status: 400 },
      )
    }

    const content = userText.length >= 80 ? userText : getSampleText(subject)

    const fiche = await generateWithPipeline({
      sourceType: "TEXT",
      subject,
      content,
    })

    return NextResponse.json({ fiche })
  } catch (err) {
    console.error("[demo] generation error", err)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la génération. Réessaie." },
      { status: 500 },
    )
  }
}
