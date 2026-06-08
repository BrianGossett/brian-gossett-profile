import { Box } from '@chakra-ui/react'
import { colors } from '../../../Theme'

interface Props {
  pdfPath: string
  page: number
}

const PdfViewer = ({ pdfPath, page }: Props) => (
  <Box mb={4}>
    <iframe
      src={`${pdfPath}#page=${page}&toolbar=0&navpanes=0&scrollbar=0`}
      style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px', background: colors.surface }}
      title="Score excerpt"
    />
    <Box mt={1}>
      <a
        href={pdfPath}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: '12px', color: colors.accent, textDecoration: 'underline' }}
      >
        Open in new tab ↗
      </a>
    </Box>
  </Box>
)

export default PdfViewer
