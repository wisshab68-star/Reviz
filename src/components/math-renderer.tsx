'use client'
import katex from 'katex'

interface MathRendererProps {
  text: string
  className?: string
}

export function MathRenderer({ text, className }: MathRendererProps) {
  const renderMath = (input: string): string => {
    let result = input

    result = result.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false
        })
      } catch {
        return `$$${math}$$`
      }
    })

    result = result.replace(/\$([^$\n]+)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false
        })
      } catch {
        return `$${math}$`
      }
    })

    result = result.replace(/\\\(([^)]+)\\\)/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false
        })
      } catch {
        return `\\(${math}\\)`
      }
    })

    return result
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  )
}
