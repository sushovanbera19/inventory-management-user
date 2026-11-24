// SearchInput: a search box that shows what you type immediately but tells the parent only
// after you pause (debounce), so a list is not re-queried on every key press.
//   <SearchInput value={filters.search} onChange={(text) => setFilters({ search: text })} />
import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { duration, ease } from '@/lib/motion'
import { Input } from './Input.jsx'

/**
 * `value` is what the parent currently searches for; `onChange(text)` is called `debounce` ms
 * after the last key press (immediately on Enter and when the field is cleared).
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounce = 300,
  autoFocus,
  className,
  'aria-label': ariaLabel = 'Search',
  onKeyDown,
  ...rest
}) {
  const outside = value ?? ''
  const inputRef = useRef(null)

  const [text, setText] = useState(outside) // what the box shows
  const [seenOutside, setSeenOutside] = useState(outside) // the `value` prop of the previous render
  const [lastSent, setLastSent] = useState(outside) // the last text given to onChange

  // Follow the parent when it changes `value` on its own (for example "Clear filters").
  // This is React's "compare with the previous prop while rendering" pattern, used instead of
  // an effect. A value that merely echoes what this box just sent is ignored, so a slow
  // parent can never overwrite letters typed in the meantime.
  if (outside !== seenOutside) {
    setSeenOutside(outside)
    if (outside !== lastSent) {
      setText(outside)
      setLastSent(outside)
    }
  }

  function send(next) {
    setLastSent(next)
    onChange?.(next)
  }

  // useDebouncedCallback always runs the newest version of this function, so `text` and
  // `lastSent` are up to date when the timer fires. A timer whose text is no longer in the box
  // (the box was cleared or reset meanwhile) or was already sent (Enter) does nothing.
  const sendLater = useDebouncedCallback((next) => {
    if (next === text && next !== lastSent) send(next)
  }, debounce)

  function sendNow(next) {
    if (next !== lastSent) send(next)
  }

  function handleChange(event) {
    const next = event.target.value
    setText(next)
    sendLater(next)
  }

  function clear() {
    setText('')
    sendNow('')
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    if (event.key === 'Enter') {
      // Search right away, and do not submit a surrounding form by accident.
      event.preventDefault()
      sendNow(text)
    } else if (event.key === 'Escape' && text !== '') {
      // First Escape empties the box; only an empty box lets Escape reach a dialog around it.
      event.stopPropagation()
      clear()
    }
  }

  return (
    <Input
      {...rest}
      ref={inputRef}
      type="search"
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoFocus={autoFocus}
      autoComplete="off"
      spellCheck={false}
      enterKeyHint="search"
      className={className}
      leftIcon={<Search />}
      rightElement={
        // A fixed-size slot, so the text does not shift when the clear button comes and goes.
        <span className="grid size-7 place-items-center">
          <AnimatePresence initial={false}>
            {text !== '' && (
              <motion.button
                key="clear"
                type="button"
                aria-label="Clear search"
                onClick={clear}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: duration.fast, ease: ease.out }}
                whileTap={{ scale: 0.88 }}
                className="grid size-7 place-items-center rounded-lg text-fg-subtle transition-colors duration-150 hover:bg-fg/6 hover:text-fg focus-visible:-outline-offset-2 [&_svg]:size-4"
              >
                <X />
              </motion.button>
            )}
          </AnimatePresence>
        </span>
      }
    />
  )
}
