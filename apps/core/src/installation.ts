// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod";

export const installationNameLength = { max: 64 } as const;

export const installationSettingsSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name for this installation")
    .max(
      installationNameLength.max,
      `Name must be at most ${installationNameLength.max} characters`,
    ),
});

export interface InstallationSettings {
  name: string;
  /** The origin people open Alcove at, from `BETTER_AUTH_URL`. */
  url: string;
  version: string;
  initializedAt: Date;
}
