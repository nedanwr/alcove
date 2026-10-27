// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { ComponentProps } from "react";

/** Alcove's mark: an arched alcove with a doorway, standing on a base line. Decorative. */
export function AlcoveMark(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M2.5 20h19" />
      <path d="M5 20v-8a7 7 0 0 1 14 0v8" />
      <path d="M9.5 20v-3.5a2.5 2.5 0 0 1 5 0V20" />
    </svg>
  );
}
