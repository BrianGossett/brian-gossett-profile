import { useState } from 'react'
import { Box, Flex, Text, Wrap, WrapItem, Link } from '@chakra-ui/react'
import PageContainer from '../../Components/Container'
import { colors } from '../../Theme'
import { PROJECTS, type Project } from '../../data/projects'

const ProjectsPage = () => {
  const [selectedId, setSelectedId] = useState(PROJECTS[0].id)
  const project = PROJECTS.find(p => p.id === selectedId) ?? PROJECTS[0]

  return (
    <PageContainer>
      {/* Page header */}
      <Box borderBottom={`1px solid ${colors.border}`} px={8} py={4}>
        <Text fontSize="xl" fontWeight="800" color={colors.textPrimary}>Projects</Text>
        <Text fontSize="xs" color={colors.textMuted}>Select a project to explore the breakdown</Text>
      </Box>

      {/* Scrollable project card strip */}
      <Box
        borderBottom={`1px solid ${colors.border}`}
        px={6}
        py={4}
        overflowX="auto"
      >
        <Flex gap={4} w="max-content">
          {PROJECTS.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              selected={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </Flex>
      </Box>

      {/* Detail panel */}
      <Box maxW="900px" mx="auto" w="100%" px={6} py={8}>
        <ProjectDetail project={project} />
      </Box>
    </PageContainer>
  )
}

interface ProjectCardProps {
  project: Project
  selected: boolean
  onClick: () => void
}

const ProjectCard = ({ project, selected, onClick }: ProjectCardProps) => (
  <Box
    onClick={onClick}
    w="180px"
    flexShrink={0}
    bg={selected ? colors.deepBlue : colors.surface}
    border={`1px solid ${selected ? colors.accent : colors.border}`}
    borderRadius="xl"
    p={4}
    cursor="pointer"
    _hover={{ borderColor: colors.accentSoft }}
  >
    <Text fontSize="2xl" mb={2}>{project.icon}</Text>
    <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={1}>{project.name}</Text>
    <Text fontSize="xs" color={selected ? colors.accent : colors.textMuted} mb={3}>{project.techSummary}</Text>
    <Text fontSize="xs" color={colors.textMuted} lineHeight="1.5">{project.description.slice(0, 80)}…</Text>
  </Box>
)

const ProjectDetail = ({ project }: { project: Project }) => (
  <Box>
    {/* Header */}
    <Flex align="center" gap={4} mb={2} flexWrap="wrap">
      <Text fontSize="2xl" fontWeight="800" color={colors.textPrimary}>{project.icon} {project.name}</Text>
      <Link
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        fontSize="xs"
        color={colors.textMuted}
        border={`1px solid ${colors.border}`}
        borderRadius="md"
        px={3}
        py={1}
        textDecoration="none"
        _hover={{ color: colors.accent, borderColor: colors.accent }}
      >
        View on GitHub ↗
      </Link>
    </Flex>

    <Text fontSize="sm" color={colors.textMuted} lineHeight="1.8" mb={6} maxW="680px">
      {project.description}
    </Text>

    {/* Tech chips */}
    <Wrap gap={2} mb={8}>
      {project.chips.map(chip => (
        <WrapItem key={chip}>
          <Box
            bg={colors.accentDim}
            border={`1px solid ${colors.accentDim}`}
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            color={colors.accent}
          >
            {chip}
          </Box>
        </WrapItem>
      ))}
    </Wrap>

    {/* Breakdown sections */}
    <Text
      fontSize="xs"
      textTransform="uppercase"
      letterSpacing="widest"
      color={colors.accent}
      fontWeight="700"
      mb={4}
    >
      How It's Built
    </Text>

    <Flex direction="column" gap={4}>
      {project.sections.map(section => (
        <Box
          key={section.title}
          bg={colors.surface}
          border={`1px solid ${colors.border}`}
          borderRadius="xl"
          p={6}
        >
          <Text fontSize="sm" fontWeight="700" color={colors.textPrimary} mb={2}>
            {section.title}
          </Text>
          <Text fontSize="sm" color={colors.textMuted} lineHeight="1.7" mb={4}>
            {section.explanation}
          </Text>
          <Box
            as="pre"
            bg={colors.pageBg}
            border={`1px solid ${colors.border}`}
            borderRadius="lg"
            p={4}
            overflowX="auto"
            fontSize="xs"
            color={colors.accent}
            lineHeight="1.7"
            fontFamily="monospace"
          >
            <Box as="code">{section.code}</Box>
          </Box>
        </Box>
      ))}
    </Flex>
  </Box>
)

export default ProjectsPage
