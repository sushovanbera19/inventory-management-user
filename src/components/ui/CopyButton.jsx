// CopyButton: copies a value to the clipboard; the icon turns into a tick for a moment.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tooltip } from './Tooltip.jsx'

export function CopyButton({ value, label = 'Copy', className }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function copy(event) {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(String(value ?? ''))
      setCopied(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Tooltip content={copied ? 'Copied!' : label}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : label}
        className={cn(
          'relative inline-grid size-7 shrink-0 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg',
          copied && 'text-success-fg hover:text-success-fg',
          className,
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? 'done' : 'copy'}
            initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.18 }}
            className="grid place-items-center"
          >
            {copied ? <Check className="size-3.5" strokeWidth={2.5} /> : <Copy className="size-3.5" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}
