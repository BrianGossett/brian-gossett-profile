import { createSystem, defaultConfig } from "@chakra-ui/react"

export const colors = {
  pageBg:    "#0f0f14",
  navBg:     "#0a0a0f",
  surface:   "#16213e",
  border:    "#1e1e2e",
  accent:    "#00b4d8",
  accentDim: "#00b4d820",
  accentGlow:"#00b4d870",
  accentSoft:"#90e0ef",
  textPrimary: "#fffffe",
  textMuted:   "#94a1b2",
  deepBlue:    "#0a192f",
} as const

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Figtree', sans-serif` },
        body:    { value: `'Figtree', sans-serif` },
      },
    },
  },
})