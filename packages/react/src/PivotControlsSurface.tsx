import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import type { PivotGridControls } from './PivotGrid.types';

interface PivotControlsSurfaceProps {
  children: ReactNode;
  controls: PivotGridControls;
}

export function PivotControlsSurface({ children, controls }: PivotControlsSurfaceProps) {
  const dialogId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(controls.defaultOpen ?? false);
  const open = controls.open ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controls.open === undefined) setUncontrolledOpen(nextOpen);
    controls.onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
      closeRef.current?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  useEffect(() => {
    if (wasOpenRef.current && !open) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  return (
    <>
      <div className="tk-pivot-controls-toolbar" data-position={controls.position ?? 'right'}>
        <button
          ref={triggerRef}
          type="button"
          aria-controls={dialogId}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          Configure pivot
        </button>
      </div>
      <dialog
        ref={dialogRef}
        id={dialogId}
        className="tk-pivot-controls-dialog"
        aria-label="Pivot controls"
        data-position={controls.position ?? 'right'}
        data-presentation={controls.presentation}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => {
          if (open) setOpen(false);
        }}
      >
        <div className="tk-pivot-controls-surface">
          <button
            ref={closeRef}
            type="button"
            className="tk-pivot-controls-close"
            aria-label="Close pivot controls"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          {children}
        </div>
      </dialog>
    </>
  );
}
