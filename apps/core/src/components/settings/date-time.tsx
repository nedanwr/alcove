// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });

export function DateTime({ value, dateOnly = false }: { value: Date; dateOnly?: boolean }) {
  return (
    // The server renders in its own locale and time zone, which the browser then replaces.
    <time dateTime={value.toISOString()} suppressHydrationWarning>
      {(dateOnly ? dateFormat : dateTimeFormat).format(value)}
    </time>
  );
}
