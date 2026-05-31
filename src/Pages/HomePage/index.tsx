import { Box, Flex, Image, Link, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
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

const SectionTitle = ({ children, id }: { children: React.ReactNode; id?: string }) => (
  <Text
    id={id}
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
        style={{ objectFit: "cover" }}
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
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        fontSize="sm"
        color={colors.textMuted}
        textDecoration="none"
        _hover={{ color: colors.accent }}
      >
        {label}
      </Link>
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
