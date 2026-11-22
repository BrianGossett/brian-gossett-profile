/**
 * Where a score PDF is fetched from. `pdfPath` is the site path from
 * src/data/scores.ts ("/scores/<file>.pdf"). When a storage URL is set
 * (VITE_SCORES_URL, ending in /scores), the PDF comes from there instead,
 * because the PDFs are too big to deploy with the site.
 */
export function scoreUrl(pdfPath: string, base: string | undefined = import.meta.env.VITE_SCORES_URL): string {
  const root = (base ?? '').trim().replace(/\/+$/, '')
  const file = pdfPath.replace(/^\/scores\//, '')
  if (!root || file === pdfPath) return encodeURI(pdfPath)
  return `${root}/${encodeURIComponent(file)}`
}
