# Sidebars

The application shell places one sidebar beside the navigation rail. The sidebar framework, in `@alcove/ui/components/ui/sidebar`, owns how a sidebar looks and behaves: its width and collapsing, its header, scrolling body, and footer, its sections and items, their active, hover, and focus states, tooltips when collapsed, and the drawer it becomes on small screens. Whoever provides a sidebar owns what goes in it: destinations, sections, icons, labels, controls, data, and permissions.

There is no configuration schema or registry. A sidebar is ordinary React content composed from the framework's parts, and anything else (a storage meter, a filter, a button) can sit among them.

## Parts

| Part                                | Role                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `SidebarProvider`                   | Holds the expanded or collapsed state and the drawer's open state. The application shell provides it.   |
| `Sidebar`                           | The container. Use `collapsible="icon"`; `label` names the drawer, and `accent` sets the accent colour. |
| `SidebarHeader`                     | The 52px top bar, usually holding `SidebarHeaderIcon`, `SidebarTitle`, and `SidebarTrigger`.            |
| `SidebarHeaderIcon`, `SidebarTitle` | The module's icon tile, filled with the accent colour, and its name. Collapsed, both are hidden.        |
| `SidebarTrigger`                    | Collapses and expands the sidebar, or opens and closes the drawer. Its label says which.                |
| `SidebarContent`, `SidebarFooter`   | The scrolling body and an optional footer.                                                              |
| `SidebarGroup`, `SidebarGroupLabel` | A section and its heading. Collapsed, the heading is visually hidden and replaced with spacing.         |
| `SidebarMenu`, `SidebarMenuItem`    | A list of items.                                                                                        |
| `SidebarMenuButton`                 | An item: an icon, a label in a `span`, and optionally a badge. Pass `isActive` and a `tooltip`.         |
| `SidebarMenuBadge`                  | A count or status inside an item, so it's part of the item's name. Collapsed, it becomes a dot.         |

Render an item as a link with `render={<a href="…" />}`, and mark the current page with `aria-current="page"`. In Core, `SidebarMenuLink` (`components/shell/sidebar-menu-link.tsx`) does both for router links.

On small screens (below `md`), the sidebar is a drawer that the trigger in the application header opens. It closes with Escape, outside clicks, and when a link inside it is followed.

## Providing a sidebar

A route provides a sidebar through its `staticData`, as a React element. The shell shows the sidebar of the deepest matched route that has one. A route without one, such as Home (`/`), has no sidebar: its content takes the full width beside the rail, and the application header leaves out the button that opens the drawer.

```tsx
export const Route = createFileRoute("/_app/settings")({
  staticData: { title: "Settings", sidebar: <SettingsRouteSidebar /> },
  component: Settings,
});

function SettingsRouteSidebar() {
  const { user } = Route.useRouteContext();

  return <SettingsSidebar administrator={user.administrator} />;
}
```

`components/settings/settings-sidebar.tsx` and `components/drive/drive-sidebar.tsx` are complete examples. Hiding a destination from the sidebar never replaces checking permissions in its route and on the server.

The rail is the platform-wide navigation: Home, the modules, and Settings. A sidebar only lists destinations within its own module, so it never links to Home, other modules, or Settings.

### Destinations that aren't implemented yet

A module's built-in destinations stay in its sidebar whether or not they're implemented, but only link to routes that exist. Drive's sidebar always lists My Files, Recent, Shared with me, Favorites, and Trash. Only My Files has a route (`/drive`), so the others render as disabled items rather than links. Giving one its `to` once Drive implements the route turns it into a link, without restructuring the sidebar.

Drive's sidebar belongs to Drive. It lives in Core (`components/drive/`) only until module integration lets the Drive module provide it: modules don't import Core code, and Core doesn't import module code.

## Appearance

Colours come from the sidebar tokens in `packages/ui/src/styles/globals.css`: `--sidebar`, `--sidebar-foreground`, `--sidebar-muted-foreground`, `--sidebar-accent` (hover), `--sidebar-primary` (the accent colour), and `--sidebar-ring`. The active item's tint and icon colour, `--sidebar-active` and `--sidebar-active-foreground`, derive from the accent, so a module's `accent` carries through in light and dark themes. Change the sidebar's appearance there or in `sidebar.tsx`, never at call sites.
