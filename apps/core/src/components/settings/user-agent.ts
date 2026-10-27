// SPDX-FileCopyrightText: 2026 Naveed Ali Anwar
// SPDX-License-Identifier: AGPL-3.0-only

// Checked in order: Edge and Opera identify as Chrome too, and Chrome as Safari.
const browsers: readonly [RegExp, string][] = [
  [/\bEdg(e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bChrome\/|\bCriOS\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
];

// iOS and Android before macOS and Linux, which their user agents also mention.
const systems: readonly [RegExp, string][] = [
  [/\biPhone\b|\biPad\b|\biPod\b/, "iOS"],
  [/\bAndroid\b/, "Android"],
  [/\bWindows\b/, "Windows"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bMacintosh\b|\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

function match(rules: readonly [RegExp, string][], userAgent: string) {
  return rules.find(([pattern]) => pattern.test(userAgent))?.[1];
}

export function describeUserAgent(userAgent: string | null) {
  const browser = userAgent ? match(browsers, userAgent) : undefined;
  const system = userAgent ? match(systems, userAgent) : undefined;
  const mobile = userAgent !== null && /\bMobile\b|\biPhone\b|\bAndroid\b/.test(userAgent);

  const label =
    browser && system ? `${browser} on ${system}` : (browser ?? system ?? "Unknown browser");
  return { label, mobile };
}
