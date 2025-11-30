"use client";

import { Theme } from "@radix-ui/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme
      accentColor="blue"
      grayColor="slate"
      radius="large"
      appearance="light"
      scaling="100%"
      style={{ "--color-background": "#e5e7eb" } as React.CSSProperties}
    >
      {children}
    </Theme>
  );
}
