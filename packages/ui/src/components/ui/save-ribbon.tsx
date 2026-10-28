// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "cn";
import {
  CheckIcon,
  CircleAlertIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "#ui/components/ui/button";

/**
 * What the ribbon shows. `saving`, `saved`, and `error` follow from `onSave` on their own; the
 * others are states only the consumer can know, so it passes them through `status`.
 */
type SaveRibbonStatus =
  | "unsaved"
  | "saving"
  | "saved"
  | "invalid"
  | "error"
  | "partial"
  | "conflict";

type SaveRibbonState = {
  status: SaveRibbonStatus;
  dirty: boolean;
  /** What the last `onSave` threw or rejected with, while the derived status is `error`. */
  error: unknown;
  save: () => void;
  discard: () => void;
};

type SaveRibbonContextValue = SaveRibbonState & { titleId: string; descriptionId: string };

type SaveResult = { kind: "idle" } | { kind: "saved" } | { kind: "failed"; error: unknown };
type Size = { width: number; height: number };

const SAVED_DURATION = 2500;
const ATTENTION_STATUSES: ReadonlySet<SaveRibbonStatus> = new Set([
  "invalid",
  "error",
  "partial",
  "conflict",
]);
// Announced when the ribbon has no title to read out.
const DEFAULT_ANNOUNCEMENTS: Record<SaveRibbonStatus, string> = {
  unsaved: "Unsaved changes",
  saving: "Saving changes",
  saved: "Changes saved",
  invalid: "Some changes need attention",
  error: "Couldn't save changes",
  partial: "Some changes couldn't be saved",
  conflict: "These changes conflict with changes made elsewhere",
};

const EASE_OUT = "cubic-bezier(0.2, 0, 0, 1)";
const SHOWN: Keyframe = { opacity: 1, transform: "none" };
const ENTER = {
  from: { opacity: 0, transform: "translateY(10px)" },
  timing: { duration: 180, easing: EASE_OUT },
} satisfies { from: Keyframe; timing: KeyframeAnimationOptions };
const EXIT = {
  to: { opacity: 0, transform: "translateY(6px)" },
  timing: { duration: 160, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
} satisfies { to: Keyframe; timing: KeyframeAnimationOptions };
// The surface resizes between the full and compact (saved) presentations while the contents
// crossfade: the outgoing copy fades out first, and the incoming contents follow.
const MORPH = {
  duration: 280,
  easing: "cubic-bezier(0.32, 0.72, 0, 1)",
} satisfies KeyframeAnimationOptions;
const FADE_OUT = {
  duration: 120,
  easing: "ease-out",
  fill: "forwards",
} satisfies KeyframeAnimationOptions;
const FADE_IN = {
  duration: 160,
  delay: 60,
  easing: EASE_OUT,
  fill: "backwards",
} satisfies KeyframeAnimationOptions;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const supportsAnimations = typeof Element !== "undefined" && "animate" in Element.prototype;

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeToReducedMotion,
    () =>
      typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function measure(element: HTMLElement): Size {
  const { width, height } = element.getBoundingClientRect();
  return { width, height };
}

function currentFrame(element: HTMLElement): Keyframe {
  const style = getComputedStyle(element);
  return { opacity: style.opacity || "1", transform: style.transform || "none" };
}

function ignoreCancellation() {}

// A static copy of the contents as they were last rendered, which fades out over the new contents
// while the ribbon morphs. It's hidden from assistive technology and can't be interacted with.
function createGhost(snapshot: HTMLElement, { width, height }: Size) {
  for (const element of snapshot.querySelectorAll("[id]")) element.removeAttribute("id");
  snapshot.dataset.slot = "save-ribbon-ghost";
  snapshot.setAttribute("aria-hidden", "true");
  snapshot.inert = true;
  Object.assign(snapshot.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    translate: "-50% -50%",
    width: `${width}px`,
    height: `${height}px`,
    opacity: "",
    pointerEvents: "none",
  });
  return snapshot;
}

const SaveRibbonContext = React.createContext<SaveRibbonContextValue | null>(null);

function useSaveRibbonContext() {
  const context = React.useContext(SaveRibbonContext);
  if (!context) {
    throw new Error("useSaveRibbon must be used within a SaveRibbon.");
  }

  return context;
}

function useSaveRibbon(): SaveRibbonState {
  return useSaveRibbonContext();
}

const saveRibbonVariants = cva("pointer-events-none z-20 h-0 w-full", {
  variants: {
    position: {
      // The last child of a scrolling container: stays at its bottom edge as it scrolls.
      sticky: "sticky bottom-0 mt-auto",
      // At the bottom of the nearest positioned ancestor, such as a non-scrolling content panel.
      absolute: "absolute inset-x-0 bottom-0",
    },
  },
  defaultVariants: {
    position: "sticky",
  },
});

type SaveRibbonProps = Omit<React.ComponentProps<"div">, "children" | "ref"> & {
  /**
   * Whether there are unsaved changes. The ribbon shows while this is true, and while it reports
   * saving, a save, or a problem.
   */
  dirty?: boolean;
  /** Shows or hides the ribbon, overriding `dirty` and `status`. Leave undefined to derive it. */
  open?: boolean;
  /**
   * Overrides the status the ribbon derives from `dirty` and `onSave`. Pass the states only the
   * consumer can know (`invalid`, `partial`, `conflict`) and leave it undefined otherwise.
   * Explicitly `undefined` too, so a consumer can pass a status it only sometimes knows.
   */
  status?: SaveRibbonStatus | undefined;
  /**
   * Saves the changes. While the returned promise is pending, the ribbon shows `saving` and ignores
   * further saves and discards. Resolving shows `saved` once `dirty` is false; rejecting (or
   * throwing) shows `error`. Return or resolve `false` when nothing was saved, such as when
   * validation fails.
   */
  onSave?: () => void | boolean | Promise<void | boolean>;
  /** Discards the changes. The consumer resets its values, which makes `dirty` false. */
  onDiscard?: () => void;
  /** Called when the `saved` status times out, which hides the ribbon unless `open` keeps it. */
  onDismiss?: () => void;
  savedDuration?: number;
  position?: "sticky" | "absolute";
  children?: React.ReactNode | ((state: SaveRibbonState) => React.ReactNode);
};

/**
 * A floating bar for pending changes, composed from the `SaveRibbon*` parts below. It owns its
 * visibility, animations, saving state, and announcements; the consumer owns what counts as a
 * change, what saving and discarding do, and its saved baseline. See `docs/development/save-ribbon.md`.
 */
function SaveRibbon({
  dirty = false,
  open,
  status: statusProp,
  onSave,
  onDiscard,
  onDismiss,
  savedDuration = SAVED_DURATION,
  position = "sticky",
  className,
  onFocus,
  onBlur,
  children,
  ...props
}: SaveRibbonProps) {
  const reducedMotion = useReducedMotion();
  const animatable = supportsAnimations && !reducedMotion;
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<SaveResult>({ kind: "idle" });

  // A new edit after a save, or undoing every change after a failure, clears the outcome.
  const [previousDirty, setPreviousDirty] = React.useState(dirty);
  if (dirty !== previousDirty) {
    setPreviousDirty(dirty);
    if (dirty ? result.kind === "saved" : result.kind === "failed") setResult({ kind: "idle" });
  }

  // `saved` waits for `dirty` to turn false, so a consumer that updates its baseline just after the
  // save resolves still gets it, while edits made during the save show as unsaved.
  const status: SaveRibbonStatus =
    statusProp ??
    (pending
      ? "saving"
      : result.kind === "failed"
        ? "error"
        : result.kind === "saved" && !dirty
          ? "saved"
          : "unsaved");

  const [dismissed, setDismissed] = React.useState(false);
  const [previousStatus, setPreviousStatus] = React.useState(status);
  if (status !== previousStatus) {
    setPreviousStatus(status);
    setDismissed(false);
  }

  const visible = open ?? (dirty || (status !== "unsaved" && !(status === "saved" && dismissed)));

  // After hiding, the ribbon stays mounted, frozen as it was, until its exit animation finishes.
  const [exiting, setExiting] = React.useState(false);
  const [previousVisible, setPreviousVisible] = React.useState(visible);
  const closing = visible === previousVisible ? exiting : !visible && animatable;
  if (visible !== previousVisible) {
    setPreviousVisible(visible);
    setExiting(closing);
  }
  const present = visible || closing;
  const [shownStatus, setShownStatus] = React.useState(status);
  if (!closing && shownStatus !== status) setShownStatus(status);
  const compact = shownStatus === "saved";

  const latest = React.useRef({ onSave, onDiscard, onDismiss, status, animatable });
  React.useLayoutEffect(() => {
    latest.current = { onSave, onDiscard, onDismiss, status, animatable };
  });

  const attemptRef = React.useRef(0);
  const pendingRef = React.useRef(false);

  const save = React.useCallback(() => {
    const { onSave: handleSave, status: currentStatus } = latest.current;
    if (!handleSave || pendingRef.current || currentStatus === "saving") return;

    const attempt = ++attemptRef.current;
    const settle = (next: SaveResult) => {
      // Unmounting makes a pending save's completion stale.
      if (attempt !== attemptRef.current) return;
      pendingRef.current = false;
      setPending(false);
      setResult(next);
    };

    pendingRef.current = true;
    setPending(true);
    setResult({ kind: "idle" });
    let outcome: ReturnType<typeof handleSave>;
    try {
      outcome = handleSave();
    } catch (error) {
      settle({ kind: "failed", error });
      return;
    }
    Promise.resolve(outcome).then(
      (value) => settle(value === false ? { kind: "idle" } : { kind: "saved" }),
      (error: unknown) => settle({ kind: "failed", error }),
    );
  }, []);

  const discard = React.useCallback(() => {
    if (pendingRef.current || latest.current.status === "saving") return;
    setResult({ kind: "idle" });
    latest.current.onDiscard?.();
  }, []);

  const savedShowing = status === "saved" && !dismissed;
  React.useEffect(() => {
    if (!savedShowing) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      latest.current.onDismiss?.();
    }, savedDuration);
    return () => clearTimeout(timer);
  }, [savedShowing, savedDuration]);

  const error = result.kind === "failed" ? result.error : undefined;
  const context = React.useMemo<SaveRibbonContextValue>(
    () => ({ status, dirty, error, save, discard, titleId, descriptionId }),
    [status, dirty, error, save, discard, titleId, descriptionId],
  );

  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const politeRef = React.useRef<HTMLDivElement>(null);
  const assertiveRef = React.useRef<HTMLDivElement>(null);
  const focusInsideRef = React.useRef(false);
  const lastFocusRef = React.useRef<HTMLElement | null>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);

  // Entrance and exit, each starting from wherever an interrupted one had got to.
  const presenceRef = React.useRef<Animation | null>(null);
  const previousVisibleRef = React.useRef<boolean | null>(null);
  React.useLayoutEffect(() => {
    if (previousVisibleRef.current === visible) return;
    previousVisibleRef.current = visible;
    const surface = surfaceRef.current;

    // Hiding with focus inside returns it to where it came from, rather than the document.
    const active = document.activeElement;
    const focusLost = active === null || active === document.body;
    if (!visible && focusInsideRef.current && (focusLost || surface?.contains(active))) {
      focusInsideRef.current = false;
      const returnFocus = returnFocusRef.current;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    }

    if (!surface) return;
    const interrupted = presenceRef.current;
    const from = interrupted ? currentFrame(surface) : null;
    interrupted?.cancel();
    presenceRef.current = null;
    if (!latest.current.animatable) return;

    const animation = visible
      ? surface.animate([from ?? ENTER.from, SHOWN], ENTER.timing)
      : surface.animate([from ?? SHOWN, EXIT.to], EXIT.timing);
    presenceRef.current = animation;
    animation.finished.then(() => {
      if (presenceRef.current !== animation) return;
      presenceRef.current = null;
      if (!visible) setExiting(false);
    }, ignoreCancellation);
  }, [visible]);

  // Morphs between the full and compact presentations. By the time this runs, the new contents
  // are rendered, so the old size and contents come from the last commit's measurement and copy.
  const sizeRef = React.useRef<Size | null>(null);
  const snapshotRef = React.useRef<HTMLElement | null>(null);
  const previousCompactRef = React.useRef<boolean | null>(null);
  const morphRef = React.useRef<{ animations: Animation[]; ghost: HTMLElement } | null>(null);

  const stopMorph = React.useCallback(() => {
    const morph = morphRef.current;
    morphRef.current = null;
    if (!morph) return;
    for (const animation of morph.animations) animation.cancel();
    morph.ghost.remove();
    bodyRef.current?.removeAttribute("style");
  }, []);

  React.useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const body = bodyRef.current;
    const previousCompact = previousCompactRef.current;
    previousCompactRef.current = present ? compact : null;
    if (!surface || !body || previousCompact === null || previousCompact === compact) return;

    // When interrupting a morph, start from the size it had reached.
    const from = morphRef.current ? measure(surface) : sizeRef.current;
    stopMorph();
    const snapshot = snapshotRef.current;
    if (!latest.current.animatable || !from || !snapshot) return;
    const to = measure(surface);
    if (from.width === to.width && from.height === to.height) return;

    // The incoming contents hold their final size, centred, while the surface resizes around them.
    Object.assign(body.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      translate: "-50% -50%",
      width: `${to.width}px`,
    });
    const ghost = createGhost(snapshot, from);
    surface.append(ghost);
    const morph = {
      ghost,
      animations: [
        surface.animate(
          [
            { width: `${from.width}px`, height: `${from.height}px` },
            { width: `${to.width}px`, height: `${to.height}px` },
          ],
          MORPH,
        ),
        body.animate([{ opacity: 0 }, { opacity: 1 }], FADE_IN),
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], FADE_OUT),
      ],
    };
    morphRef.current = morph;
    Promise.all(morph.animations.map((animation) => animation.finished)).then(() => {
      if (morphRef.current === morph) stopMorph();
    }, ignoreCancellation);
  }, [compact, present, stopMorph]);

  // After the morph, which reads the previous commit's size and contents.
  React.useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const body = bodyRef.current;
    if (!surface || !body) {
      sizeRef.current = null;
      snapshotRef.current = null;
      return;
    }
    if (!morphRef.current) sizeRef.current = measure(surface);
    const snapshot = latest.current.animatable ? body.cloneNode(true) : null;
    snapshotRef.current = snapshot instanceof HTMLElement ? snapshot : null;
  });

  // Keeps the last size current between commits, such as when the window resizes.
  const observeSurface = React.useCallback((surface: HTMLDivElement | null) => {
    surfaceRef.current = surface;
    if (!surface || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (!morphRef.current) sizeRef.current = measure(surface);
    });
    observer.observe(surface);
    return () => {
      observer.disconnect();
      surfaceRef.current = null;
    };
  }, []);

  React.useEffect(
    () => () => {
      // Unmounting cancels animations and makes a pending save's completion stale.
      attemptRef.current += 1;
      presenceRef.current?.cancel();
      stopMorph();
    },
    [stopMorph],
  );

  // When the focused control disappears, such as Save once saved, focus moves to the ribbon
  // rather than the document.
  React.useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const lastFocus = lastFocusRef.current;
    if (!surface || !lastFocus || lastFocus.isConnected) return;
    lastFocusRef.current = null;
    if (document.activeElement === null || document.activeElement === document.body) {
      surface.focus({ preventScroll: true });
    }
  });

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event);
    focusInsideRef.current = true;
    if (event.target instanceof HTMLElement && event.target !== event.currentTarget) {
      lastFocusRef.current = event.target;
    }
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !event.currentTarget.contains(from)) {
      returnFocusRef.current = from;
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    onBlur?.(event);
    const to = event.relatedTarget;
    if (!(to instanceof Node && event.currentTarget.contains(to))) focusInsideRef.current = false;
  };

  // Announces each status, and each appearance, once: changing the count of changes doesn't repeat
  // it. It reads the rendered title and description, in whatever words the consumer chose.
  React.useEffect(() => {
    const polite = politeRef.current;
    const assertive = assertiveRef.current;
    if (!polite || !assertive) return;
    if (!visible) {
      polite.textContent = "";
      assertive.textContent = "";
      return;
    }

    const read = (slot: string) =>
      bodyRef.current?.querySelector(`[data-slot="${slot}"]`)?.textContent?.trim() ?? "";
    const text =
      [read("save-ribbon-title"), read("save-ribbon-description")].filter(Boolean).join(". ") ||
      DEFAULT_ANNOUNCEMENTS[status];
    const urgent = ATTENTION_STATUSES.has(status);
    (urgent ? polite : assertive).textContent = "";
    (urgent ? assertive : polite).textContent = text;
  }, [status, visible]);

  const ariaLabelled = props["aria-label"] === undefined && props["aria-labelledby"] === undefined;

  return (
    <>
      {present && (
        <div data-slot="save-ribbon" className={saveRibbonVariants({ position })}>
          <div
            ref={observeSurface}
            data-slot="save-ribbon-surface"
            data-state={closing ? "closing" : "open"}
            data-status={shownStatus}
            data-compact={compact || undefined}
            role="region"
            aria-labelledby={ariaLabelled ? titleId : undefined}
            aria-busy={shownStatus === "saving"}
            tabIndex={-1}
            inert={closing}
            className={cn(
              "pointer-events-auto absolute inset-x-0 bottom-(--save-ribbon-offset) mx-auto w-[min(660px,calc(100%-32px))] overflow-hidden rounded-[12px] bg-inverse text-[13px] text-inverse-foreground shadow-inverse transition-shadow duration-150 outline-none motion-reduce:transition-none data-compact:w-fit data-compact:max-w-[calc(100%-32px)]",
              "data-[status=error]:ring-1 data-[status=error]:ring-destructive/60 data-[status=invalid]:ring-1 data-[status=invalid]:ring-destructive/60 data-[status=partial]:ring-1 data-[status=partial]:ring-destructive/60",
              className,
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          >
            <SaveRibbonBody ref={bodyRef} context={context} compact={compact} frozen={closing}>
              {children}
            </SaveRibbonBody>
          </div>
        </div>
      )}
      <div ref={politeRef} className="sr-only" aria-live="polite" aria-atomic />
      <div ref={assertiveRef} className="sr-only" aria-live="assertive" aria-atomic />
    </>
  );
}

type SaveRibbonBodyProps = {
  ref: React.Ref<HTMLDivElement>;
  context: SaveRibbonContextValue;
  compact: boolean;
  frozen: boolean;
  children: SaveRibbonProps["children"];
};

// While frozen (hiding), skips rendering, so the ribbon fades out as it was rather than, say,
// showing "0 changes".
const SaveRibbonBody = React.memo(
  function SaveRibbonBody({ ref, context, compact, children }: SaveRibbonBodyProps) {
    return (
      <SaveRibbonContext.Provider value={context}>
        <div
          ref={ref}
          data-slot="save-ribbon-body"
          data-compact={compact || undefined}
          className="group/save-ribbon flex min-h-13 flex-wrap items-center gap-x-3 gap-y-2 py-2 pr-2 pl-3.5 data-compact:min-h-11 data-compact:justify-center data-compact:pr-4"
        >
          {typeof children === "function" ? children(context) : children}
        </div>
      </SaveRibbonContext.Provider>
    );
  },
  (_previous, next) => next.frozen,
);

const indicatorIcons: Record<SaveRibbonStatus, React.ReactNode> = {
  unsaved: (
    <span className="size-2.25 rounded-full bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--warning)_24%,transparent)]" />
  ),
  saving: <LoaderCircleIcon className="animate-spin" />,
  saved: <CheckIcon className="text-success" strokeWidth={2.5} />,
  invalid: <CircleAlertIcon className="text-destructive" />,
  error: <CircleAlertIcon className="text-destructive" />,
  partial: <TriangleAlertIcon className="text-warning" />,
  conflict: <RefreshCwIcon className="text-warning" />,
};

/** The status icon. It's decorative: the ribbon announces its status itself. */
function SaveRibbonIndicator({ className, ...props }: React.ComponentProps<"span">) {
  const { status } = useSaveRibbonContext();

  return (
    <span
      data-slot="save-ribbon-indicator"
      data-status={status}
      aria-hidden
      className={cn(
        "flex size-5.5 shrink-0 items-center justify-center [&_svg]:size-4.75",
        className,
      )}
      {...props}
    >
      <span
        key={status}
        className="flex items-center justify-center duration-150 animate-in fade-in-0 zoom-in-75 motion-reduce:animate-none"
      >
        {indicatorIcons[status]}
      </span>
    </span>
  );
}

function SaveRibbonContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="save-ribbon-content"
      className={cn(
        "flex min-w-0 grow basis-48 flex-col gap-0.5 group-data-compact/save-ribbon:grow-0 group-data-compact/save-ribbon:basis-auto",
        className,
      )}
      {...props}
    />
  );
}

/** Names the ribbon for assistive technology, and is what it announces. */
function SaveRibbonTitle({ className, ...props }: React.ComponentProps<"div">) {
  const { titleId } = useSaveRibbonContext();

  return (
    <div
      data-slot="save-ribbon-title"
      id={titleId}
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 leading-[1.4] font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function SaveRibbonDescription({ className, ...props }: React.ComponentProps<"div">) {
  const { descriptionId } = useSaveRibbonContext();

  return (
    <div
      data-slot="save-ribbon-description"
      id={descriptionId}
      className={cn("text-[12.5px] leading-[1.4] opacity-78", className)}
      {...props}
    />
  );
}

function SaveRibbonScope({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="save-ribbon-scope"
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 text-[11.5px] font-medium whitespace-nowrap text-warning [&_svg]:size-3",
        className,
      )}
      {...props}
    />
  );
}

function SaveRibbonActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="save-ribbon-actions"
      className={cn("ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5", className)}
      {...props}
    />
  );
}

type SaveRibbonActionProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size"> & {
  variant?: "ghost" | "outline" | "primary";
};

function SaveRibbonAction({ variant = "outline", className, ...props }: SaveRibbonActionProps) {
  return (
    <Button
      variant={variant === "primary" ? "default" : variant}
      // Save and Discard stay focusable while disabled, so focus isn't lost when saving starts.
      className={cn("data-disabled:cursor-default data-disabled:opacity-45", className)}
      {...props}
    />
  );
}

/** Calls the ribbon's `onSave`, and shows a spinner while saving. Use it for Retry too. */
function SaveRibbonSave({
  variant = "primary",
  disabled = false,
  className,
  children = "Save",
  onClick,
  ...props
}: SaveRibbonActionProps) {
  const { status, save } = useSaveRibbonContext();
  const saving = status === "saving";

  return (
    <SaveRibbonAction
      variant={variant}
      disabled={disabled || saving}
      focusableWhenDisabled
      data-pending={saving || undefined}
      className={cn("relative data-pending:data-disabled:opacity-100", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) save();
      }}
      {...props}
    >
      {/* The label stays, transparent, so the button keeps its width and accessible name. */}
      <span className={cn("inline-flex items-center gap-1.5", saving && "opacity-0")}>
        {children}
      </span>
      {saving && <LoaderCircleIcon aria-hidden className="absolute inset-0 m-auto animate-spin" />}
    </SaveRibbonAction>
  );
}

function SaveRibbonDiscard({
  variant = "ghost",
  disabled = false,
  children = "Discard",
  onClick,
  ...props
}: SaveRibbonActionProps) {
  const { status, discard } = useSaveRibbonContext();

  return (
    <SaveRibbonAction
      variant={variant}
      disabled={disabled || status === "saving"}
      focusableWhenDisabled
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) discard();
      }}
      {...props}
    >
      {children}
    </SaveRibbonAction>
  );
}

export {
  SaveRibbon,
  SaveRibbonAction,
  SaveRibbonActions,
  SaveRibbonContent,
  SaveRibbonDescription,
  SaveRibbonDiscard,
  SaveRibbonIndicator,
  SaveRibbonSave,
  SaveRibbonScope,
  SaveRibbonTitle,
  saveRibbonVariants,
  useSaveRibbon,
};
export type { SaveRibbonProps, SaveRibbonState, SaveRibbonStatus };
