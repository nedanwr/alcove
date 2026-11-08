// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import type { LucideIcon } from "lucide-react";

import type { ModuleIdentity } from "~/components/shell/navigation";
import type { FileRouteTypes } from "~/routeTree.gen";

export interface SearchResult {
  /** Unique within its group. */
  id: string;
  title: string;
  /** Where the result lives, such as its folder or section. */
  location: string;
  to: FileRouteTypes["to"];
  icon: LucideIcon;
}

/** Results from one module, or from Core's settings. */
export interface SearchResultGroup {
  source: ModuleIdentity;
  items: SearchResult[];
}

/**
 * Returns the results for a query, grouped by where they come from. Core's settings are the only
 * source until installed modules can contribute their own results.
 */
export type Search = (query: string) => SearchResultGroup[];
