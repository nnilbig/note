// Native Pointer Events swipe detector (per PRD's "Pointer Events 原生封裝"
// choice) -- covers touch, pen, and mouse without a gesture library.
// Right = complete, left = migrate/cancel cycle, per the source blueprint.
const SWIPE_THRESHOLD_PX = 80
const MOVE_THRESHOLD_PX = 10

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function useSwipeAction(handlers: SwipeHandlers) {
  const offsetX = ref(0)
  const dragging = ref(false)
  let startX = 0
  let startY = 0
  let pointerId: number | null = null
  let tracking = false

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // vuedraggable's reorder-drag starts from .drag-handle -- don't let a
    // swipe gesture race it for the same pointerdown.
    if ((event.target as HTMLElement)?.closest?.('.drag-handle')) return
    tracking = true
    startX = event.clientX
    startY = event.clientY
    pointerId = event.pointerId
  }

  function onPointerMove(event: PointerEvent) {
    if (!tracking || event.pointerId !== pointerId) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY

    if (!dragging.value) {
      if (Math.abs(dx) < MOVE_THRESHOLD_PX) return
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical intent (page scroll) -- bail without ever capturing the
        // pointer, so a plain tap or scroll on this row is untouched.
        tracking = false
        return
      }
      dragging.value = true
      const target = event.currentTarget as HTMLElement | null
      target?.setPointerCapture?.(pointerId)
    }

    offsetX.value = dx
  }

  function settle() {
    if (offsetX.value > SWIPE_THRESHOLD_PX) handlers.onSwipeRight?.()
    else if (offsetX.value < -SWIPE_THRESHOLD_PX) handlers.onSwipeLeft?.()
    dragging.value = false
    tracking = false
    offsetX.value = 0
    pointerId = null
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    settle()
  }

  function onPointerCancel() {
    dragging.value = false
    tracking = false
    offsetX.value = 0
    pointerId = null
  }

  return { offsetX, dragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
