// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
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
  type SaveRibbonStatus,
} from "@alcove/ui/components/ui/save-ribbon";
import { useBlocker } from "@tanstack/react-router";
import { ServerIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * How saving one section went. `failed` with `progress` means part of it was saved, such as a
 * username saved alongside an email that wasn't. Sections update their own baselines.
 */
export type SectionSaveResult =
  | { status: "saved" }
  | { status: "invalid" }
  | { status: "failed"; message: string; progress?: boolean };

export type PendingChanges = {
  changes: number;
  invalid: boolean;
  /** Shows that saving changes the server for everyone, not just this account. */
  appliesToEveryone?: boolean;
  /** Validates and saves the section. Never rejects: it reports failures in its result. */
  save: () => Promise<SectionSaveResult>;
  discard: () => void;
  focusFirstInvalidField: () => void;
};

type SectionSummary = Pick<PendingChanges, "changes" | "invalid" | "appliesToEveryone">;

type SettingsChangesContextValue = {
  register: (id: string, section: RefObject<PendingChanges>) => () => void;
  report: (id: string, summary: SectionSummary) => void;
  dirty: boolean;
};

const SettingsChangesContext = createContext<SettingsChangesContextValue | null>(null);

function useSettingsChanges() {
  const context = useContext(SettingsChangesContext);
  if (!context) throw new Error("Settings sections must be rendered within SettingsChanges.");
  return context;
}

export function usePendingChanges(section: PendingChanges) {
  const { register, report } = useSettingsChanges();
  const id = useId();
  const latest = useRef(section);
  useEffect(() => {
    latest.current = section;
  });
  useEffect(() => register(id, latest), [register, id]);

  const { changes, invalid, appliesToEveryone = false } = section;
  useEffect(
    () => report(id, { changes, invalid, appliesToEveryone }),
    [report, id, changes, invalid, appliesToEveryone],
  );
}

/**
 * Coordinates one settings page's independently saved sections behind a single save ribbon, which
 * it renders after `children`. Each section keeps its own form, validation, and backend operation.
 */
export function SettingsChanges({ children }: { children: ReactNode }) {
  // In registration order, which is the order the sections appear on the page.
  const sections = useRef(new Map<string, RefObject<PendingChanges>>());
  const [summaries, setSummaries] = useState<ReadonlyMap<string, SectionSummary>>(new Map());

  const register = useCallback((id: string, section: RefObject<PendingChanges>) => {
    sections.current.set(id, section);
    return () => {
      sections.current.delete(id);
      setSummaries((previous) => {
        const next = new Map(previous);
        next.delete(id);
        return next;
      });
    };
  }, []);

  const report = useCallback((id: string, summary: SectionSummary) => {
    setSummaries((previous) => new Map(previous).set(id, summary));
  }, []);

  const pending = [...summaries.values()].filter((summary) => summary.changes > 0);
  const dirty = pending.length > 0;
  const context = useMemo(() => ({ register, report, dirty }), [register, report, dirty]);

  return (
    <SettingsChangesContext.Provider value={context}>
      {children}
      <SettingsSaveRibbon
        sections={sections}
        changes={pending.reduce((total, summary) => total + summary.changes, 0)}
        invalid={pending.some((summary) => summary.invalid)}
        appliesToEveryone={pending.some((summary) => summary.appliesToEveryone)}
      />
    </SettingsChangesContext.Provider>
  );
}

type Failure = { message: string };
type Problem = { kind: "error" | "partial"; failures: readonly Failure[] };

function SettingsSaveRibbon({
  sections,
  changes,
  invalid,
  appliesToEveryone,
}: {
  sections: RefObject<Map<string, RefObject<PendingChanges>>>;
  changes: number;
  invalid: boolean;
  appliesToEveryone: boolean;
}) {
  const [problem, setProblem] = useState<Problem>();
  const dirty = changes > 0;

  // Reverting every failed change by hand leaves nothing to report.
  const [previousDirty, setPreviousDirty] = useState(dirty);
  if (dirty !== previousDirty) {
    setPreviousDirty(dirty);
    if (!dirty) setProblem(undefined);
  }

  const pendingSections = () =>
    [...sections.current.values()].map((section) => section.current).filter((s) => s.changes > 0);

  // The ribbon derives `saving`, `saved`, and `unsaved`; only the page knows about the rest.
  const status: SaveRibbonStatus | undefined = !dirty
    ? undefined
    : invalid
      ? "invalid"
      : problem?.kind === "partial"
        ? "partial"
        : undefined;

  return (
    <SaveRibbon
      dirty={dirty}
      status={status}
      onSave={async () => {
        setProblem(undefined);
        // Independent sections, so each is saved (or found invalid) on its own.
        const results = await Promise.all(pendingSections().map((section) => section.save()));
        const failures = results.filter((result) => result.status === "failed");
        if (failures.length === 0) {
          // Nothing was sent for a section that failed validation.
          return !results.some((result) => result.status === "invalid");
        }
        const progress = results.some(
          (result) =>
            result.status === "saved" || (result.status === "failed" && result.progress === true),
        );
        setProblem({ kind: progress ? "partial" : "error", failures });
        if (!progress) throw new Error(failures.map((failure) => failure.message).join(" "));
        return true;
      }}
      onDiscard={() => {
        setProblem(undefined);
        for (const section of pendingSections()) section.discard();
      }}
    >
      {({ status: shown }) => (
        <>
          <SaveRibbonIndicator />
          <SaveRibbonContent>
            <SaveRibbonTitle>
              {ribbonTitle(shown, changes)}
              {appliesToEveryone && shown !== "saved" ? (
                <SaveRibbonScope>
                  <ServerIcon aria-hidden />
                  Applies to everyone
                </SaveRibbonScope>
              ) : null}
            </SaveRibbonTitle>
            {shown === "invalid" ? (
              <SaveRibbonDescription>Fix them to save your changes.</SaveRibbonDescription>
            ) : (shown === "error" || shown === "partial") && problem ? (
              <SaveRibbonDescription>
                {problem.failures.map((failure) => failure.message).join(" ")}
              </SaveRibbonDescription>
            ) : null}
          </SaveRibbonContent>
          {shown === "saved" ? null : (
            <SaveRibbonActions>
              <SaveRibbonDiscard />
              {shown === "invalid" ? (
                <SaveRibbonAction
                  variant="primary"
                  onClick={() =>
                    pendingSections()
                      .find((section) => section.invalid)
                      ?.focusFirstInvalidField()
                  }
                >
                  Show problems
                </SaveRibbonAction>
              ) : (
                <SaveRibbonSave>
                  {shown === "error" || shown === "partial" ? "Retry" : "Save"}
                </SaveRibbonSave>
              )}
            </SaveRibbonActions>
          )}
        </>
      )}
    </SaveRibbon>
  );
}

function ribbonTitle(status: SaveRibbonStatus, changes: number) {
  switch (status) {
    case "saving":
      return "Saving changes…";
    case "saved":
      return "Changes saved";
    case "invalid":
      return "Some fields need attention";
    case "error":
      return "Couldn’t save your changes";
    case "partial":
      return "Some changes couldn’t be saved";
    default:
      return changes === 1 ? "1 unsaved change" : `${changes} unsaved changes`;
  }
}

/**
 * Asks before in-app navigation, or leaving the page, would lose unsaved settings. Render it inside
 * `SettingsChanges`.
 */
export function UnsavedChangesGuard() {
  const { dirty } = useSettingsChanges();

  useBlocker({
    disabled: !dirty,
    // Leaving the browser (reload, closing the tab) shows the browser's own prompt.
    enableBeforeUnload: dirty,
    shouldBlockFn: ({ current, next }) =>
      current.pathname !== next.pathname &&
      !window.confirm("Leave this page? Your unsaved changes will be lost."),
  });

  return null;
}
