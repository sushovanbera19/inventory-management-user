/**
 * Remembers which overlays (modals, drawers, menus) are open, in the order they opened,
 * so Escape closes only the one on top: a confirm dialog opened from a modal closes first.
 */
const stack = []
let counter = 0

/** Register an overlay as open. Returns its id and a function that unregisters it. */
export function pushOverlay() {
  counter += 1
  const id = counter
  stack.push(id)
  return {
    id,
    release() {
      const index = stack.lastIndexOf(id)
      if (index !== -1) stack.splice(index, 1)
    },
  }
}

export function isTopOverlay(id) {
  return stack[stack.length - 1] === id
}
