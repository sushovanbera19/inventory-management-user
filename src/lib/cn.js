// cn(): joins class names and resolves Tailwind conflicts (clsx + tailwind-merge).
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join class names and resolve Tailwind conflicts (the last one wins).
 *   cn('px-3 py-2', isActive && 'bg-brand-600', className)
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
