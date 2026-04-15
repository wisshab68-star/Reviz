'use client'

import katex from 'katex'

interface MathRendererProps {
  text: string
  className?: string
}

const EXPLICIT_MATH_PATTERN = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
const EXPLICIT_MATH_DETECTOR = /\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/
const NAKED_LATEX_PATTERN = /\\(?:frac|bar|cup|cap|text|times|sqrt|sum|int|lim|vec|forall|exists|emptyset|cdot|leq|geq|neq|infty|mathbb|left|right|Si|et|ou)\b|\\[A-Za-z]+(?=\{)|P\([^)]*\\(?:cup|cap|bar)[^)]*\)/
const KNOWN_LATEX_COMMANDS = new Set([
  'frac', 'bar', 'cup', 'cap', 'text', 'times', 'sqrt', 'sum', 'int', 'lim',
  'vec', 'forall', 'exists', 'emptyset', 'cdot', 'leq', 'geq', 'neq', 'infty',
  'mathbb', 'left', 'right', 'overline', 'underline', 'alpha', 'beta', 'gamma',
  'delta', 'epsilon', 'lambda', 'mu', 'pi', 'sigma', 'theta', 'phi', 'psi', 'omega',
])

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderKatex(math: string, displayMode: boolean) {
  try {
    return katex.renderToString(normalizeMathInput(math).trim(), {
      displayMode,
      throwOnError: false,
    })
  } catch {
    return escapeHtml(math)
  }
}

function normalizeMathInput(value: string) {
  let normalized = value

  normalized = normalized.replace(/−/g, '-')
  normalized = normalized.replace(/\\Si\b/g, '\\text{Si }')
  normalized = normalized.replace(/\\et\b/g, '\\text{ et }')
  normalized = normalized.replace(/\\ou\b/g, '\\text{ ou }')
  normalized = normalized.replace(/\\\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*)/g, (_, word: string) => ` \\text{${word}}`)
  normalized = normalized.replace(/\\([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]*)\b/g, (match: string, command: string) => {
    return KNOWN_LATEX_COMMANDS.has(command) ? match : `\\text{${command}}`
  })

  return normalized
}

function looksLikeNakedLatex(value: string) {
  const text = value.trim()

  if (!text || !NAKED_LATEX_PATTERN.test(text)) {
    return false
  }

  const longWords = text.match(/[A-Za-zÀ-ÿ']{9,}/g) ?? []
  return longWords.length <= 6
}

function renderPlainSegment(segment: string) {
  if (!segment) {
    return ''
  }

  if (looksLikeNakedLatex(segment)) {
    return renderKatex(segment, false)
  }

  // Preserve newlines as <br> so multi-line content (piège, exemple, définition) renders correctly
  return segment
    .split('\n')
    .map(escapeHtml)
    .join('<br>')
}

function renderMath(input: string): string {
  if (!input) {
    return ''
  }

  if (!EXPLICIT_MATH_DETECTOR.test(input) && looksLikeNakedLatex(input)) {
    return renderKatex(input, false)
  }

  const matcher = new RegExp(EXPLICIT_MATH_PATTERN.source, EXPLICIT_MATH_PATTERN.flags)

  let result = ''
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = matcher.exec(input)) !== null) {
    result += renderPlainSegment(input.slice(lastIndex, match.index))

    const math = match[1] ?? match[2] ?? match[3] ?? match[4] ?? ''
    const displayMode = match[1] !== undefined || match[3] !== undefined
    result += renderKatex(math, displayMode)

    lastIndex = matcher.lastIndex
  }

  result += renderPlainSegment(input.slice(lastIndex))

  return result
}

export function MathRenderer({ text, className }: MathRendererProps) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  )
}
