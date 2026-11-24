/**
 * "Fly to cart": a copy of the product picture arcs from where it was clicked into the cart
 * icon in the header (any element with data-cart-target), which then bumps.
 * Plain DOM + Web Animations, so it never re-renders React. Call it from a click handler.
 */
export function flyToCart(sourceElement) {
  if (typeof window === 'undefined' || !sourceElement) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = [...document.querySelectorAll('[data-cart-target]')].find((element) => element.offsetParent !== null)
  if (!target) return

  const from = sourceElement.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = Math.min(from.width, from.height, 160)
  const flyer = document.createElement('img')
  flyer.src = sourceElement.currentSrc || sourceElement.src
  flyer.alt = ''
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '24px',
    objectFit: 'cover',
    zIndex: 100,
    pointerEvents: 'none',
    boxShadow: '0 20px 40px -10px rgb(112 99 247 / 0.5)',
  })
  document.body.appendChild(flyer)

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 120}px) scale(0.6) rotate(-12deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(10deg)`, opacity: 0.4 },
    ],
    { duration: 800, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
  )
  animation.onfinish = () => {
    flyer.remove()
    target.classList.remove('animate-cart-bump')
    // Restart the bump animation even if it ran a moment ago.
    void target.offsetWidth
    target.classList.add('animate-cart-bump')
  }
}
