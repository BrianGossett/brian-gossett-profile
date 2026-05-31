# Profile Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the personal profile page into a dark-themed, sidebar-layout developer portfolio with cyan accents, populated with Brian's real resume content.

**Architecture:** Three files are modified — Theme.ts exports a palette constants object, Container.tsx gets a restyled dark Header/Footer, and HomePage.tsx is rewritten with a 260px left sidebar (identity + skills + contact cards) beside a scrollable main area (about, experience timeline, certifications). No new routes, no new packages.

**Tech Stack:** React 19, Chakra UI v3, TypeScript, Vite

---

## File Map

| File | What changes |
|------|--------------|
| `src/Theme.ts` | Export `colors` constants object for the dark palette |
| `src/Components/Container/index.tsx` | Restyle Header (dark, BG logo, cyan links) and Footer |
| `src/Pages/HomePage/index.tsx` | Full rewrite — sidebar + main content layout |

---

### Task 1: Export palette constants from Theme.ts

**Files:**
- Modify: `src/Theme.ts`

- [ ] **Step 1: Add color constants export**

Replace the full contents of `src/Theme.ts` with:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: exits 0, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/Theme.ts
git commit -m "feat: export dark palette constants from Theme.ts"
```

---

### Task 2: Restyle Header and Footer in Container

**Files:**
- Modify: `src/Components/Container/index.tsx`

- [ ] **Step 1: Rewrite Container, Header, and Footer**

Replace the full contents of `src/Components/Container/index.tsx` with:

```tsx
import { Box, Flex, Text, VStack } from "@chakra-ui/react"
import { colors } from "../../Theme"

const PageContainer: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return (
    <VStack minHeight="100vh" minWidth="100vw" align="stretch" bg={colors.pageBg}>
      <Header />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </VStack>
  )
}

export const Header = () => {
  return (
    <Flex
      as="header"
      bg={colors.navBg}
      borderBottom={`1px solid ${colors.border}`}
      px={8}
      py={4}
      align="center"
      gap={8}
    >
      <Text fontWeight="800" fontSize="lg" color={colors.accent} letterSpacing="0.5px">
        BG
      </Text>
      <Flex as="nav" gap={6}>
        <Box as="a" href="#hero"       color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Home</Box>
        <Box as="a" href="#about"      color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>About</Box>
        <Box as="a" href="#experience" color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Experience</Box>
        <Box as="a" href="#contact"    color={colors.textMuted} fontSize="sm" _hover={{ color: colors.accent }} style={{ textDecoration: "none", cursor: "pointer" }}>Contact</Box>
      </Flex>
    </Flex>
  )
}

export const Footer = () => {
  return (
    <Box
      as="footer"
      bg={colors.navBg}
      borderTop={`1px solid ${colors.border}`}
      textAlign="center"
      py={5}
    >
      <Text fontSize="sm" color={colors.textMuted}>
        &copy; {new Date().getFullYear()} Brian Gossett. All rights reserved.
      </Text>
    </Box>
  )
}

export default PageContainer
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: dark nav bar with cyan "BG" logo, muted nav links, dark footer. The hero/about content from the old HomePage will still show — that's fine.

- [ ] **Step 4: Commit**

```bash
git add src/Components/Container/index.tsx
git commit -m "feat: restyle header and footer with dark theme"
```

---

### Task 3: Build the Sidebar in HomePage

**Files:**
- Modify: `src/Pages/HomePage/index.tsx`

- [ ] **Step 1: Replace HomePage with sidebar shell + Identity card**

Replace the full contents of `src/Pages/HomePage/index.tsx` with:

```tsx
import { Box, Flex, Image, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import PageContainer from "../../Components/Container"
import ProfilePic from "../../assets/Me.jpg"
import { colors } from "../../Theme"

// ── Shared sub-components ──────────────────────────────────────────────────

const SidebarCard: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <Box
    bg={colors.surface}
    borderRadius="xl"
    border={`1px solid ${colors.border}`}
    p={6}
  >
    {children}
  </Box>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text
    fontSize="xs"
    textTransform="uppercase"
    letterSpacing="widest"
    color={colors.accent}
    fontWeight="700"
    mb={4}
    pb={3}
    borderBottom={`1px solid ${colors.accentDim}`}
  >
    {children}
  </Text>
)

// ── Sidebar ────────────────────────────────────────────────────────────────

const Badge = ({ children }: { children: React.ReactNode }) => (
  <Box
    display="inline-flex"
    alignItems="center"
    bg={colors.deepBlue}
    border={`1px solid ${colors.accentDim}`}
    borderRadius="full"
    px={3}
    py={1}
    fontSize="xs"
    color={colors.accentSoft}
  >
    {children}
  </Box>
)

const IdentityCard = () => (
  <SidebarCard>
    <VStack gap={3}>
      <Image
        src={ProfilePic}
        alt="Brian Gossett"
        borderRadius="full"
        boxSize="90px"
        objectFit="cover"
        border={`2px solid ${colors.accent}`}
      />
      <Box textAlign="center">
        <Text fontWeight="800" fontSize="lg" color={colors.textPrimary} mb={1}>
          Brian Gossett
        </Text>
        <Text
          fontSize="xs"
          color={colors.accent}
          textTransform="uppercase"
          letterSpacing="widest"
          mb={3}
        >
          Senior Frontend Developer
        </Text>
        <VStack gap={2}>
          <Badge>✈ Air Force Veteran</Badge>
          <Badge>🔒 Top Secret Clearance</Badge>
          <Badge>☁ AWS Certified</Badge>
        </VStack>
      </Box>
    </VStack>
  </SidebarCard>
)

const SKILLS = [
  "TypeScript", "React", "Node.js", "GraphQL", "AWS", "GCP",
  "Docker", "NextJS", "PostgreSQL", "Jest", "Git",
  "Apollo Client", "MUI", "Jenkins", "Kubernetes", "Firebase",
]

const SkillTag = ({ label }: { label: string }) => (
  <Box
    bg={colors.deepBlue}
    border={`1px solid ${colors.accentDim}`}
    borderRadius="md"
    px={2}
    py={1}
    fontSize="xs"
    color={colors.accentSoft}
  >
    {label}
  </Box>
)

const SkillsCard = () => (
  <SidebarCard>
    <SectionTitle>Tech Stack</SectionTitle>
    <Wrap gap={2}>
      {SKILLS.map((s) => (
        <WrapItem key={s}>
          <SkillTag label={s} />
        </WrapItem>
      ))}
    </Wrap>
  </SidebarCard>
)

const ContactCard = () => (
  <SidebarCard>
    <SectionTitle id="contact">Contact</SectionTitle>
    <VStack align="start" gap={3}>
      <ContactRow icon="⌥" href="https://www.linkedin.com/in/brian-gossett-686aa4175/" label="LinkedIn" />
      <ContactRow icon="◈" href="https://github.com/BrianGossett" label="GitHub / BrianGossett" />
      <ContactRow icon="✉" href="mailto:Brian.Gossett.usa@gmail.com" label="Brian.Gossett.usa@gmail.com" />
      <ContactRow icon="◎" label="Lubbock, TX" />
    </VStack>
  </SidebarCard>
)

const ContactRow = ({ icon, href, label }: { icon: string; href?: string; label: string }) => (
  <Flex align="center" gap={2}>
    <Text color={colors.accent} fontSize="sm" minW="16px">{icon}</Text>
    {href ? (
      <Box
        as="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        fontSize="sm"
        color={colors.textMuted}
        style={{ textDecoration: "none" }}
        _hover={{ color: colors.accent }}
      >
        {label}
      </Box>
    ) : (
      <Text fontSize="sm" color={colors.textMuted}>{label}</Text>
    )}
  </Flex>
)

// ── Main content sections ──────────────────────────────────────────────────

const ContentSection: React.FC<React.PropsWithChildren<{ id?: string }>> = ({ id, children }) => (
  <Box
    id={id}
    bg={colors.surface}
    borderRadius="xl"
    border={`1px solid ${colors.border}`}
    p={7}
  >
    {children}
  </Box>
)

const AboutSection = () => (
  <ContentSection id="about">
    <SectionTitle>About Me</SectionTitle>
    <Text fontSize="sm" lineHeight="1.8" color={colors.textMuted}>
      Seasoned software developer and <Box as="span" color={colors.textPrimary} fontWeight="600">Air Force veteran</Box> with
      a background in front-end and full-stack development using{" "}
      <Box as="span" color={colors.textPrimary} fontWeight="600">TypeScript, JavaScript, and React</Box>.
      I have an active <Box as="span" color={colors.textPrimary} fontWeight="600">Top Secret clearance</Box> and
      experience delivering scalable and secure applications in agile environments across government
      and private sectors.
    </Text>
  </ContentSection>
)

interface ExpItemProps {
  role: string
  company: string
  date: string
  bullets: string[]
}

const ExpItem = ({ role, company, date, bullets }: ExpItemProps) => (
  <Flex gap={4} pb={5} mb={5} borderBottom={`1px solid ${colors.border}`} _last={{ borderBottom: "none", pb: 0, mb: 0 }}>
    <Box
      w="10px"
      h="10px"
      borderRadius="full"
      bg={colors.accent}
      boxShadow={`0 0 8px ${colors.accentGlow}`}
      mt="5px"
      flexShrink={0}
    />
    <Box flex={1}>
      <Text fontWeight="700" fontSize="sm" color={colors.textPrimary} mb="2px">{role}</Text>
      <Text fontSize="xs" color={colors.accent} mb="2px">{company}</Text>
      <Text fontSize="xs" color={colors.textMuted} mb={3}>{date}</Text>
      <VStack align="start" gap={1}>
        {bullets.map((b, i) => (
          <Flex key={i} gap={2} align="start">
            <Text color={colors.accent} fontSize="sm" lineHeight="1.6">›</Text>
            <Text fontSize="xs" color={colors.textMuted} lineHeight="1.6">{b}</Text>
          </Flex>
        ))}
      </VStack>
    </Box>
  </Flex>
)

const EXPERIENCE: ExpItemProps[] = [
  {
    role: "Front End Developer",
    company: "Trellis Energy",
    date: "July 2025 – Present",
    bullets: [
      "Developed and refactored React components within a micro frontend architecture to improve user workflows and UI consistency.",
      "Diagnosed and resolved critical performance bottlenecks, leading to measurable improvements in page load times across core modules.",
      "Collaborated cross-functionally with backend engineers, QA, and product teams on a SaaS energy management platform.",
    ],
  },
  {
    role: "Senior React Developer",
    company: "Acuity Inc",
    date: "August 2022 – May 2025",
    bullets: [
      "Developed a micro frontend communication system to streamline modular app integration.",
      "Led MUI5 migration efforts across multiple applications; implemented GraphQL APIs and supported React 18 migration.",
      "Built map search UI components serving 10k+ users; conducted hundreds of code reviews.",
    ],
  },
  {
    role: "Lead React Developer / Cloud Engineer",
    company: "U.S. Air Force – BESPIN / AFLCMC",
    date: "March 2014 – April 2021",
    bullets: [
      "Deployed Digital University web app to GCP; built and maintained reusable React component libraries.",
      "Oversaw cloud migration from on-prem to AWS; maintained compliance for a $2M software contract.",
    ],
  },
]

const ExperienceSection = () => (
  <ContentSection id="experience">
    <SectionTitle>Experience</SectionTitle>
    {EXPERIENCE.map((exp) => (
      <ExpItem key={exp.company} {...exp} />
    ))}
  </ContentSection>
)

interface CertCardProps {
  name: string
  detail: string
}

const CertCard = ({ name, detail }: CertCardProps) => (
  <Box
    bg={colors.deepBlue}
    border={`1px solid ${colors.accentDim}`}
    borderRadius="lg"
    p={4}
    flex={1}
    minW="160px"
  >
    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>{name}</Text>
    <Text fontSize="xs" color={colors.accent}>{detail}</Text>
  </Box>
)

const CERTS: CertCardProps[] = [
  { name: "AWS Cloud Practitioner", detail: "May 2024" },
  { name: "Top Secret Security Clearance", detail: "Active since April 2021" },
  { name: "B.S. Computer Science", detail: "Bellevue University · 2024" },
]

const CertificationsSection = () => (
  <ContentSection>
    <SectionTitle>Certifications & Education</SectionTitle>
    <Flex gap={3} flexWrap="wrap">
      {CERTS.map((c) => (
        <CertCard key={c.name} {...c} />
      ))}
    </Flex>
  </ContentSection>
)

// ── Page ───────────────────────────────────────────────────────────────────

const HomePage = () => {
  return (
    <PageContainer>
      <Box id="hero" maxW="1100px" mx="auto" w="100%" px={6} py={10}>
        <Flex gap={8} align="start" direction={{ base: "column", md: "row" }}>
          {/* Sidebar */}
          <VStack gap={5} w={{ base: "100%", md: "260px" }} flexShrink={0}>
            <IdentityCard />
            <SkillsCard />
            <ContactCard />
          </VStack>

          {/* Main content */}
          <VStack gap={6} flex={1} align="stretch">
            <AboutSection />
            <ExperienceSection />
            <CertificationsSection />
          </VStack>
        </Flex>
      </Box>
    </PageContainer>
  )
}

export default HomePage
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: exits 0, no type errors.

- [ ] **Step 3: Start dev server and visually verify**

```bash
npm run dev
```

Open `http://localhost:5173`. Check:
- Dark page background (`#0f0f14`)
- Left sidebar with photo, name, cyan title, three badges
- Skill tags in a grid wrap
- Contact links (LinkedIn, GitHub, email, location)
- About Me card with bolded key phrases
- Experience timeline with three roles, glowing cyan dots, bullet points
- Certifications row with three cards

- [ ] **Step 4: Verify mobile layout**

In browser DevTools, switch to a 375px viewport (iPhone). Expected: sidebar stacks above main content, full width.

- [ ] **Step 5: Verify nav anchor links**

Click each nav link in the header. Expected: page scrolls to the corresponding section (`#about`, `#experience`, `#contact`).

- [ ] **Step 6: Commit**

```bash
git add src/Pages/HomePage/index.tsx
git commit -m "feat: rewrite homepage with dark sidebar layout"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dark theme (`#0f0f14` bg, `#16213e` cards) | Task 2 (Container bg) + Task 3 (SidebarCard, ContentSection) |
| Cyan accent `#00b4d8` | Task 1 (exported), used throughout Task 2 + 3 |
| Sidebar 260px: photo, name, title, badges | Task 3 — IdentityCard |
| Skills tag cloud | Task 3 — SkillsCard |
| Contact: LinkedIn, GitHub, email, location | Task 3 — ContactCard |
| Nav: BG logo, dark bar, anchor links | Task 2 — Header |
| About Me with resume summary | Task 3 — AboutSection |
| Experience timeline with glowing dots | Task 3 — ExperienceSection / ExpItem |
| Certifications row | Task 3 — CertificationsSection |
| Footer dark + copyright | Task 2 — Footer |
| Mobile responsive (sidebar stacks) | Task 3 — `direction={{ base: "column", md: "row" }}` |
| No new packages | All tasks — Chakra UI primitives only |

**Placeholder scan:** No TBDs, TODOs, or "similar to above" references. All code blocks are complete.

**Type consistency:**
- `SidebarCard`, `SectionTitle`, `Badge`, `SkillTag`, `ContactRow` — all defined before use
- `ExpItemProps`, `CertCardProps` — interfaces defined before their components
- `EXPERIENCE` and `CERTS` arrays typed against those interfaces
- `colors` object imported from `../../Theme` in both Container and HomePage
