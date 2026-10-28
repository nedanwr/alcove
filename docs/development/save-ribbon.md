# Save ribbon

The save ribbon is the floating bar that appears when a page has unsaved changes, offering to save or discard them. It lives in `@alcove/ui/components/ui/save-ribbon`, so Core and modules share one implementation.

The ribbon owns how it looks and behaves: when it shows and hides, its animations, the saving state, duplicate-save protection, the saved confirmation and its dismissal, focus, and screen reader announcements. The consumer owns everything about the data: what counts as a change, validation, what saving and discarding do, and its saved baseline. The ribbon never inspects forms, depends on a form library, or blocks navigation, and there is no global provider or registry: each page renders its own ribbon, for one form or several.

## Parts

| Part                    | Role                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `SaveRibbon`            | The root: visibility, status, saving, animation, focus, and announcements. Takes the props below.          |
| `SaveRibbonIndicator`   | The 22px status icon: a warning dot, spinner, check, or alert, following the status. Decorative.           |
| `SaveRibbonContent`     | The text area, which grows to fill the space beside the actions.                                           |
| `SaveRibbonTitle`       | The heading, such as "3 unsaved changes". It names the ribbon and is what it announces.                    |
| `SaveRibbonDescription` | Optional supporting text, also announced.                                                                  |
| `SaveRibbonScope`       | An optional badge for the reach of the changes, such as "Applies to everyone". Presentational only.        |
| `SaveRibbonActions`     | The buttons, at the end. They wrap onto their own line when the ribbon is narrow.                          |
| `SaveRibbonSave`        | Calls `onSave`, and shows a spinner while saving. Label it "Retry" after a failure.                        |
| `SaveRibbonDiscard`     | Calls `onDiscard`. Disabled while saving.                                                                  |
| `SaveRibbonAction`      | Any other button, such as Review, Show problems, or Keep theirs. `variant`: `ghost`, `outline`, `primary`. |
| `useSaveRibbon`         | The ribbon's state (`status`, `dirty`, `error`, `save`, `discard`), for custom parts rendered inside it.   |

The ribbon's `children` can also be a function of that state, which is how a consumer varies its content by status:

```tsx
<SaveRibbon dirty={dirty} onSave={save} onDiscard={discard}>
  {({ status }) => (status === "saved" ? <Saved /> : <Unsaved />)}
</SaveRibbon>
```

## Props and precedence

| Prop            | Default    | Meaning                                                                                                      |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `dirty`         | `false`    | Whether there are unsaved changes.                                                                           |
| `onSave`        |            | Saves. May return a promise; resolving `false` means nothing was saved (say, validation failed).             |
| `onDiscard`     |            | Discards. The consumer resets its values, which makes `dirty` false.                                         |
| `status`        |            | Overrides the derived status. Use it for what only the consumer knows: `invalid`, `partial`, and `conflict`. |
| `open`          |            | Overrides visibility entirely.                                                                               |
| `onDismiss`     |            | Called when the saved confirmation times out.                                                                |
| `savedDuration` | `2500`     | How long the saved confirmation shows, in milliseconds.                                                      |
| `position`      | `"sticky"` | `"sticky"` or `"absolute"`; see [Positioning](#positioning).                                                 |

There is one source of truth for each question:

1. **Status** is `status` if given. Otherwise the ribbon derives it: `saving` while the promise from `onSave` is pending; `error` after it rejects (or `onSave` throws), until the next save, a discard, or `dirty` turning false; `saved` after it resolves, once `dirty` is false; and `unsaved` otherwise.
2. **Visibility** is `open` if given. Otherwise the ribbon shows while `dirty` is true or the status is anything but `unsaved`, except that `saved` hides itself after `savedDuration`. With `open` given, the consumer hides it, using `onDismiss` if it wants the timeout.
3. **Saving** is the ribbon's own: while a save is pending, or `status` is `saving`, further saves and discards are ignored and the buttons are disabled.

A save that resolves while `dirty` is still true (the user kept editing while it saved, or the baseline hasn't caught up) shows `unsaved` rather than `saved`, and becomes `saved` when `dirty` turns false. An edit during the saved confirmation cancels its timeout and returns the ribbon to `unsaved`.

## Statuses

| Status     | Indicator               | Outline | Typical actions                    |
| ---------- | ----------------------- | ------- | ---------------------------------- |
| `unsaved`  | Warning dot             |         | Review (optional), Discard, Save   |
| `saving`   | Spinner                 |         | Discard (disabled), Save (pending) |
| `saved`    | Success check           |         | None; the ribbon contracts to fit  |
| `invalid`  | Danger `CircleAlert`    | Danger  | Show problems, Discard             |
| `error`    | Danger `CircleAlert`    | Danger  | Discard, Retry                     |
| `partial`  | Warning `TriangleAlert` | Danger  | Review, Discard, Retry             |
| `conflict` | Warning `RefreshCw`     |         | The consumer's resolution actions  |

The ribbon only presents these states. Validating, locating invalid fields, coordinating partial saves, reviewing changes, and resolving conflicts belong to the consumer, through the actions it renders.

## Examples

### A simple form

The consumer keeps its saved baseline and compares against it. Updating the baseline before `onSave` resolves makes `dirty` false, which turns the ribbon into the saved confirmation.

```tsx
function InstallationNameForm({ initialName }: { initialName: string }) {
  const [savedName, setSavedName] = useState(initialName);
  const [name, setName] = useState(initialName);

  return (
    <form className="flex flex-1 flex-col pb-(--save-ribbon-clearance)">
      <Input value={name} onChange={(event) => setName(event.target.value)} />

      <SaveRibbon
        dirty={name !== savedName}
        onSave={async () => {
          await updateInstallationName({ data: { name } });
          setSavedName(name); // The new baseline: `dirty` becomes false.
        }}
        onDiscard={() => setName(savedName)}
      >
        {({ status }) => (
          <>
            <SaveRibbonIndicator />
            <SaveRibbonContent>
              <SaveRibbonTitle>
                {status === "saved"
                  ? "Changes saved"
                  : status === "saving"
                    ? "Saving…"
                    : "Unsaved changes"}
              </SaveRibbonTitle>
            </SaveRibbonContent>
            {status !== "saved" && (
              <SaveRibbonActions>
                <SaveRibbonDiscard />
                <SaveRibbonSave />
              </SaveRibbonActions>
            )}
          </>
        )}
      </SaveRibbon>
    </form>
  );
}
```

If the save fails, `onSave` rejects: the ribbon shows `error`, the values and baseline are untouched, and the changes stay pending. With a form library, derive `dirty` from it (for example, TanStack Form's `isDirty`) and reset the form to the saved values after saving.

### Controlled state

A page that saves through its own machinery (several forms, a mutation library, a server push) can drive the status itself. Keep `status` undefined for the states the ribbon derives well, and pass only what it can't know:

```tsx
const [problem, setProblem] = useState<"invalid" | "conflict" | undefined>();

<SaveRibbon
  dirty={profile.dirty || security.dirty}
  status={mutation.isPending ? "saving" : problem}
  onSave={async () => {
    if (!validate()) {
      setProblem("invalid");
      return false; // Nothing was saved.
    }
    setProblem(undefined);
    await mutation.mutateAsync(values);
  }}
  onDiscard={() => {
    setProblem(undefined);
    resetAll();
  }}
>
  …
</SaveRibbon>;
```

### Validation errors and conflicts

Contextual actions are ordinary `SaveRibbonAction`s:

```tsx
<SaveRibbon dirty={dirty} status={status} onSave={save} onDiscard={discard}>
  <SaveRibbonIndicator />
  <SaveRibbonContent>
    {status === "invalid" ? (
      <>
        <SaveRibbonTitle>2 fields need attention</SaveRibbonTitle>
        <SaveRibbonDescription>Fix them to save your changes.</SaveRibbonDescription>
      </>
    ) : (
      <>
        <SaveRibbonTitle>Changed by someone else</SaveRibbonTitle>
        <SaveRibbonDescription>
          The installation name was updated while you were editing.
        </SaveRibbonDescription>
      </>
    )}
  </SaveRibbonContent>
  <SaveRibbonActions>
    {status === "invalid" ? (
      <>
        <SaveRibbonDiscard />
        <SaveRibbonAction variant="primary" onClick={focusFirstInvalidField}>
          Show problems
        </SaveRibbonAction>
      </>
    ) : (
      <>
        <SaveRibbonAction variant="ghost" onClick={keepTheirs}>
          Keep theirs
        </SaveRibbonAction>
        <SaveRibbonSave>Overwrite</SaveRibbonSave>
      </>
    )}
  </SaveRibbonActions>
</SaveRibbon>
```

For instance-wide settings, add `<SaveRibbonScope><ServerIcon />Applies to everyone</SaveRibbonScope>` inside the title. Whether to show it is the consumer's decision; the ribbon knows nothing about roles or permissions.

## Positioning

The ribbon floats, horizontally centred, `--save-ribbon-offset` (12px) above the bottom of its container, at most 660px wide and 16px clear of either side. It never assumes Alcove's rail, sidebar, or viewport: it positions itself within whatever contains it.

- **`position="sticky"`** (default): render the ribbon as the last child of the page's scrolling content. It sticks to the bottom of the scroll container as the page scrolls. In a flex column, which Core's content panel is, it also sits at the bottom when the page is shorter than the panel.
- **`position="absolute"`**: the ribbon sits at the bottom of its nearest positioned ancestor. Use it in a panel that doesn't scroll, or render it outside the scroller in a `relative` panel.

The ribbon floats over content, so leave room below the last controls for it. `--save-ribbon-clearance` is the ribbon's height plus twice its offset; pad the page's scrolling content with it, as in `pb-(--save-ribbon-clearance)`. Content that wraps onto two lines on narrow screens makes the ribbon taller, so pages whose last control matters on small screens can add more.

## Animation

The ribbon is one element throughout: it never remounts between states.

- **Appearing** fades it in over 180ms while it rises 10px. **Hiding** fades it out with a slight downward movement; it stays mounted, showing what it showed last, until the fade finishes. Showing it again partway through reverses from wherever it had got to.
- **Saving** keeps the ribbon's size: only the indicator and buttons change.
- **Saved** contracts the ribbon from its full width (and 52px height) to the width of its compact content (and 44px), staying centred, over 280ms. The contents crossfade: a static copy of the outgoing contents fades out over 120ms while the new contents fade in, starting 60ms later. Returning from saved to unsaved reverses this, and interrupting a morph starts the next one from the size it had reached.
- **Problems** keep the full width; only the contents, indicator, and outline change.

CSS can't transition between intrinsic widths in every browser, so the ribbon measures its sizes and animates explicit dimensions with the Web Animations API. Animations only present state changes; they never decide them.

With `prefers-reduced-motion: reduce`, the ribbon skips the movement, morph, crossfade, and indicator transitions, and shows and hides instantly. Statuses and the saved dismissal work the same.

## Accessibility

- The ribbon is a region named by its title. It never takes focus when it appears.
- Status changes are announced once each, from the title and description: politely for unsaved (when the ribbon appears), saving, and saved; assertively for `invalid`, `error`, `partial`, and `conflict`. Updating the content without changing the status, such as the count of changes, isn't announced again.
- The region has `aria-busy` while saving. Save and Discard stay focusable while disabled (`aria-disabled`), so focus isn't lost when saving starts.
- If the focused button disappears, such as Save once saved, focus moves to the ribbon itself. When the ribbon hides with focus inside, focus returns to where it was before entering the ribbon.
- The ribbon advertises no keyboard shortcuts. A feature that implements one (say, saving with Ctrl+S, by calling `save` from `useSaveRibbon` or its own handler) can mention it in the description.

## Appearance

The ribbon is an inverted surface: dark in the light theme and light in the dark theme. Its colours come from the `--inverse*` tokens in `packages/ui/src/styles/globals.css`. Inside the ribbon, the shared tokens (`--foreground`, `--accent`, `--input`, `--ring`, `--success`, `--warning`, `--destructive`) are remapped to their inverse counterparts, so the shared button variants and status colours read correctly on it. Save uses the primary teal. Change the ribbon's appearance there or in `save-ribbon.tsx`, never at call sites.
