// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { Button } from "@alcove/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@alcove/ui/components/ui/popover";
import { BellIcon } from "lucide-react";

import { DateTime } from "~/components/settings/date-time";
import { ModuleIcon } from "~/components/shell/module-icon";
import type { ModuleIdentity } from "~/components/shell/navigation";

export interface AppNotification {
  id: string;
  source: ModuleIdentity;
  message: string;
  createdAt: Date;
  unread: boolean;
}

/**
 * The application header's notifications button and panel. Nothing delivers notifications yet, so
 * the shell passes none; "Mark all read" only shows when there are unread ones and a way to mark them.
 */
export function Notifications({
  notifications,
  onMarkAllRead,
  open,
  onOpenChange,
}: {
  notifications: readonly AppNotification[];
  onMarkAllRead?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const unread = notifications.filter((notification) => notification.unread).length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        render={<Button variant="ghost" size="icon" />}
        // Open, it takes the selected treatment rather than the hover one.
        className="relative aria-expanded:bg-selected aria-expanded:text-ring"
      >
        <BellIcon aria-hidden strokeWidth={1.75} className="size-4.5" />
        {unread > 0 ? (
          <span
            aria-hidden
            data-slot="notifications-unread"
            className="absolute top-[7px] right-2 size-[7px] rounded-full bg-primary ring-2 ring-sidebar"
          />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="max-h-[min(420px,var(--available-height))] w-[min(380px,calc(100vw-24px))] gap-0 overflow-hidden rounded-[12px] border border-border p-0 ring-0 motion-reduce:animate-none"
      >
        <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-divider py-2.5 pr-2.5 pl-4">
          <PopoverTitle className="flex-1 text-[14px] font-semibold">Notifications</PopoverTitle>
          {unread > 0 && onMarkAllRead ? (
            <Button variant="ghost" size="sm" className="h-7 text-[12.5px]" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          ) : null}
        </div>
        {notifications.length > 0 ? (
          <ul className="min-h-0 overflow-y-auto overscroll-contain p-1.5">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
            <BellIcon
              aria-hidden
              strokeWidth={1.75}
              className="mb-2 size-5 text-muted-foreground"
            />
            <p className="text-[13px] font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">
              Updates from your modules will show up here.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ notification }: { notification: AppNotification }) {
  return (
    <li className="flex items-start gap-3 rounded-[8px] p-2.5">
      <ModuleIcon
        icon={notification.source.icon}
        tint={notification.source.tint}
        variant="notification"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[1.45]">{notification.message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {notification.source.title} · <DateTime value={notification.createdAt} />
        </p>
      </div>
      {notification.unread ? (
        <span className="mt-1.5 size-[7px] shrink-0 rounded-full bg-primary">
          <span className="sr-only">Unread</span>
        </span>
      ) : null}
    </li>
  );
}
