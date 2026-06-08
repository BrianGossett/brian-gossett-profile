import { Box, Text } from '@chakra-ui/react'
import { colors } from '../../../Theme'

interface Props {
  pdfPath: string
  startPage: number
  measures: string
}

const PdfViewer = ({ pdfPath, startPage, measures }: Props) => (
  <Box mb={4}>
    <Text fontSize="xs" color={colors.textMuted} mb={2}>{measures}</Text>
    <iframe
      src={`${pdfPath}#page=${startPage}`}
      style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px', background: colors.surface }}
      title="Score excerpt"
    />
    <Box mt={1}>
      <Text
        as="a"
        href={pdfPath}
        target="_blank"
        rel="noopener noreferrer"
        fontSize="xs"
        color={colors.accent}
        textDecoration="underline"
      >
        Open in new tab ↗
      </Text>
    </Box>
  </Box>
)

export default PdfViewer
