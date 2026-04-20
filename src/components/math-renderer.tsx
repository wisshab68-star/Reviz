'use client'

import katex from 'katex'

interface MathRendererProps {
  text: string
  className?: string
}

const EXPLICIT_MATH_PATTERN = /\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
const EXPLICIT_MATH_DETECTOR = /\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/
// Kept for P(...) special case only — command detection now uses KNOWN_LATEX_COMMANDS
const NAKED_LATEX_SPECIAL = /\\[A-Za-z]+(?=\{)|P\([^)]*\\(?:cup|cap|bar)[^)]*\)/
const KNOWN_LATEX_COMMANDS = new Set([
  'frac', 'bar', 'cup', 'cap', 'text', 'times', 'sqrt', 'sum', 'int', 'lim',
  'vec', 'forall', 'exists', 'emptyset', 'cdot', 'leq', 'geq', 'neq', 'infty',
  'mathbb', 'left', 'right', 'overline', 'underline', 'alpha', 'beta', 'gamma',
  'delta', 'epsilon', 'lambda', 'mu', 'pi', 'sigma', 'theta', 'phi', 'psi', 'omega',
  'mapsto', 'to', 'Rightarrow', 'Leftarrow', 'Leftrightarrow', 'rightarrow', 'leftarrow',
  'leftrightarrow', 'iff', 'implies', 'in', 'notin', 'subset', 'subseteq', 'supset',
  'supseteq', 'land', 'lor', 'lnot', 'neg', 'wedge', 'vee', 'equiv', 'sim', 'simeq',
  'approx', 'pm', 'mp', 'div', 'mod', 'circ', 'bullet', 'oplus', 'otimes', 'partial',
  'nabla', 'perp', 'parallel', 'angle', 'triangle', 'square', 'Diamond', 'ell',
  'Re', 'Im', 'wp', 'aleph', 'hbar', 'imath', 'jmath',
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
  if (!text) return false

  // Check for known LaTeX commands (covers \mapsto, \to, \frac, \rightarrow, etc.)
  const commands = text.match(/\\([A-Za-z]+)/g)
  const hasKnownCommand = commands?.some(cmd => KNOWN_LATEX_COMMANDS.has(cmd.slice(1))) ?? false

  // Also check for \cmd{...} pattern and P(...) special case
  const hasSpecial = NAKED_LATEX_SPECIAL.test(text)

  if (!hasKnownCommand && !hasSpecial) return false

  // Reject if too many long natural-language words (it's a sentence, not a formula)
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
