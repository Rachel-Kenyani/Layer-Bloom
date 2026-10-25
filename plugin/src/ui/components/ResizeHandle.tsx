import { send } from '../bridge.ts';

/** Drag the bottom-right corner to resize the plugin window. */
export function ResizeHandle() {
  function onPointerDown(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement;
    const startX = event.screenX;
    const startY = event.screenY;
    const startWidth = globalThis.innerWidth;
    const startHeight = globalThis.innerHeight;
    let frame = 0;

    const onMove = (move: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() =>
        send({ type: 'resize', width: startWidth + move.screenX - startX, height: startHeight + move.screenY - startY }),
      );
    };
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
    };

    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
  }

  return (
    <button type="button" class="resize-handle" aria-label="Resize window" title="Drag to resize" onPointerDown={onPointerDown}>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M11 4 4 11M11 8 8 11" />
      </svg>
    </button>
  );
}
