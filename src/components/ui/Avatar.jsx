// Avatar: a person's or company's picture, or their initials on a colour picked from the name
// (the same name always gets the same colour).
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { getInitials, hashString } from '@/lib/format'

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-xl',
}

const GRADIENTS = [
  'from-violet-500 to-indigo-500',
  'from-sky-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-fuchsia-500 to-purple-500',
  'from-blue-500 to-indigo-600',
  'from-teal-500 to-green-500',
]

export function Avatar({ name = '', src, size = 'md', className, ...rest }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-semibold text-white ring-2 ring-surface',
        !showImage && ['bg-linear-to-br', GRADIENTS[hashString(name) % GRADIENTS.length]],
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img src={src} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden={name ? undefined : true} title={name || undefined}>
          {getInitials(name)}
        </span>
      )}
    </span>
  )
}
