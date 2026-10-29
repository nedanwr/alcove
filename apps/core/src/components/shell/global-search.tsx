// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@alcove/ui/components/ui/autocomplete";
import { Kbd } from "@alcove/ui/components/ui/kbd";
import { useMediaQuery } from "@alcove/ui/hooks/use-media-query";
import { useRouter } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ModuleIcon } from "~/components/shell/module-icon";
import type { Search, SearchResult, SearchResultGroup } from "~/components/shell/search";

const RESULTS_PER_GROUP = 3;

// The platform never changes while the page is open.
const subscribeToPlatform = () => () => {};
const isApplePlatform = () =>
  /\bMacintosh\b|\bMac OS X\b|\biPhone\b|\biPad\b/.test(navigator.userAgent);

/**
 * The application header's search field. Its results come from `search`; Cmd+K or Ctrl+K focuses
 * it from anywhere, and Escape clears it.
 */
export function GlobalSearch({
  search,
  open,
  onOpenChange,
}: {
  search: Search;
  /** Whether the results may show. They only do once there's a query. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const groups = useMemo(
    () =>
      trimmedQuery === ""
        ? []
        : search(trimmedQuery).map((group): SearchResultGroup => ({
            ...group,
            items: group.items.slice(0, RESULTS_PER_GROUP),
          })),
    [search, trimmedQuery],
  );

  // Unknown until hydrated, so the server never shows the wrong platform's shortcut.
  const apple = useSyncExternalStore(subscribeToPlatform, isApplePlatform, () => null);
  const compact = useMediaQuery("(width < 640px)");

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      if (event.altKey || event.shiftKey) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function clear() {
    setQuery("");
    onOpenChange(false);
  }

  function choose(result: SearchResult) {
    clear();
    void router.navigate({ to: result.to });
  }

  return (
    <Autocomplete
      items={groups}
      // `search` has already filtered the results.
      filter={null}
      itemToStringValue={(result: SearchResult) => result.title}
      autoHighlight
      value={query}
      onValueChange={(value, details) => {
        // Choosing a result navigates to it, rather than filling in the field with its title.
        if (details.reason !== "item-press") setQuery(value);
      }}
      open={open && trimmedQuery !== ""}
      onOpenChange={onOpenChange}
    >
      <div data-slot="global-search" className="relative w-full max-w-[560px] min-w-0">
        <SearchIcon
          aria-hidden
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <AutocompleteInput
          ref={inputRef}
          aria-label="Search Alcove"
          placeholder={compact ? "Search" : "Search files, mail, events and notes"}
          {...(apple === null ? {} : { "aria-keyshortcuts": apple ? "Meta+K" : "Control+K" })}
          autoComplete="off"
          spellCheck={false}
          className="pr-[46px] pl-[34px]"
          onKeyDown={(event) => {
            if (event.key === "Escape" && query !== "") clear();
          }}
        />
        {apple === null ? null : (
          <Kbd
            aria-hidden
            className="absolute top-1/2 right-2.5 -translate-y-1/2 max-[760px]:hidden"
          >
            {apple ? "⌘K" : "Ctrl+K"}
          </Kbd>
        )}
      </div>
      <AutocompleteContent>
        <AutocompleteEmpty>
          {trimmedQuery === "" ? null : (
            <div className="px-3 py-[18px]">
              No matches for “{trimmedQuery}” in your installed modules.
            </div>
          )}
        </AutocompleteEmpty>
        <AutocompleteList>
          {(group: SearchResultGroup) => (
            <AutocompleteGroup key={group.source.title} items={group.items}>
              <AutocompleteGroupLabel>{group.source.title}</AutocompleteGroupLabel>
              <AutocompleteCollection>
                {(result: SearchResult) => (
                  <AutocompleteItem key={result.id} value={result} onClick={() => choose(result)}>
                    <ModuleIcon icon={result.icon} tint={group.source.tint} variant="result" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{result.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {result.location}
                      </span>
                    </span>
                  </AutocompleteItem>
                )}
              </AutocompleteCollection>
            </AutocompleteGroup>
          )}
        </AutocompleteList>
      </AutocompleteContent>
    </Autocomplete>
  );
}
