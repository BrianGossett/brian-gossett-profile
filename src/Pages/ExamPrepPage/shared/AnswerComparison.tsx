import { Box, Flex, Text } from '@chakra-ui/react'
import { colors } from '../../../Theme'

interface Props {
  answer: string
  /** Only some questions have one. Without it, the user's answer takes the full width. */
  modelAnswer?: string
  /** 'page' sits on the page background, 'card' inside a question card. */
  variant?: 'page' | 'card'
}

/** The user's answer beside the model answer, on the grading screens. */
const AnswerComparison = ({ answer, modelAnswer, variant = 'page' }: Props) => {
  const card = variant === 'card'
  const radius = card ? 'lg' : 'xl'
  const pad = card ? 3 : 4
  return (
    <Flex gap={4} mb={card ? 3 : 4} direction={{ base: 'column', md: 'row' }}>
      <Box flex={1} bg={card ? colors.pageBg : colors.surface} border={`1px solid ${colors.border}`} borderRadius={radius} p={pad}>
        <Text fontSize="9px" color={colors.textMuted} mb={1}>YOUR ANSWER</Text>
        <Text fontSize="sm" color={colors.textPrimary} whiteSpace="pre-wrap">{answer || '(no answer)'}</Text>
      </Box>
      {modelAnswer && (
        <Box flex={1} bg="#0d1a0d" border="1px solid #1a3a1a" borderRadius={radius} p={pad}>
          <Text fontSize="9px" color="#2cb67d" mb={1}>MODEL ANSWER</Text>
          <Text fontSize="sm" color={colors.textPrimary} lineHeight="1.6">{modelAnswer}</Text>
        </Box>
      )}
    </Flex>
  )
}

export default AnswerComparison
