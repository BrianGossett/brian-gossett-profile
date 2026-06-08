export interface AnalysisQuestion {
  prompt: string
  modelAnswer: string
}

export interface ScoreExcerpt {
  id: number
  title: string
  composer: string
  era: string
  yearRange: string
  pdfPath: string    // e.g. "/scores/9 Bach Orchestral Suite No 3.pdf"
  startPage: number
  measures: string   // label shown above the PDF viewer
  questions: AnalysisQuestion[]
}

export const ALL_SCORES: ScoreExcerpt[] = [
  {
    id: 1,
    title: "Orchestral Suite No. 3 in D — Air",
    composer: "Johann Sebastian Bach",
    era: "Baroque",
    yearRange: "1725–1731",
    pdfPath: "/scores/9 Bach Orchestral Suite No 3.pdf",
    startPage: 1,
    measures: "mm. 1–32",
    questions: [
      {
        prompt: "Describe the texture and instrumentation evident in this excerpt.",
        modelAnswer: "The excerpt is scored for strings with continuo, typical of Baroque orchestral writing. The texture alternates between homophonic chordal passages and contrapuntal elaboration in inner voices. The bass line moves consistently in eighth notes, functioning as continuo.",
      },
      {
        prompt: "Identify any cadences in the first 16 measures and label them by type.",
        modelAnswer: "A perfect authentic cadence (PAC) occurs at m. 8: V–I in D major, both root position, ^1 in the soprano. An imperfect authentic cadence (IAC) at m. 4 provides a weaker close at the midpoint of the first phrase.",
      },
      {
        prompt: "What form or structural principle governs this excerpt? Justify your answer.",
        modelAnswer: "The excerpt follows ritornello form — a characteristic Baroque structural principle in which a recurring tutti refrain alternates with lighter solo episodes. The opening tutti statement in the tonic returns in varied or partial form at later structural points.",
      },
      {
        prompt: "Identify the composer, era, approximate date, and specific work if possible. Cite evidence from the score.",
        modelAnswer: "Johann Sebastian Bach, Baroque, c. 1725–1731. Evidence: D major, string orchestra with continuo, imitative counterpoint in inner voices, regular four-bar hypermeter, Baroque ornamentation, and French-overture stylistic features. The Air from Orchestral Suite No. 3 is identifiable by its flowing melody over a walking bass.",
      },
    ],
  },
  {
    id: 2,
    title: "Piano Sonata in A Major, K. 331 — Theme",
    composer: "Wolfgang Amadeus Mozart",
    era: "Classical",
    yearRange: "1783",
    pdfPath: "/scores/24 Mozart Piano Sonata in A major K 331.pdf",
    startPage: 1,
    measures: "mm. 1–18",
    questions: [
      {
        prompt: "Describe the harmonic rhythm in mm. 1–8.",
        modelAnswer: "The harmonic rhythm is slow and regular — roughly one chord per bar in mm. 1–4, with slight acceleration toward the half cadence at m. 4. This deliberate harmonic pacing under a flowing melodic surface is a hallmark of Classical style.",
      },
      {
        prompt: "Identify and label all cadences in mm. 1–18 by type and measure number.",
        modelAnswer: "HC at m. 4 (antecedent phrase closes on V). PAC at m. 8 (consequent closes V–I, root position, ^1 in soprano). Second phrase pair closes with another PAC at m. 18, providing stronger confirmation of A major.",
      },
      {
        prompt: "Describe the phrase structure of mm. 1–18.",
        modelAnswer: "Measures 1–8 form a parallel period: antecedent (mm. 1–4, HC) answered by a consequent (mm. 5–8, PAC). The second unit (mm. 9–18) extends the idea with a slightly longer phrase, ending in a strong PAC. This is consistent with a theme-and-variations opening.",
      },
      {
        prompt: "Identify the composer, era, approximate date, and work. Cite evidence from the score.",
        modelAnswer: "Wolfgang Amadeus Mozart, Classical, c. 1783. Evidence: piano solo texture, Alberti bass accompaniment, A major, simple diatonic harmony, regular four-bar phrasing, ornamental grace notes, and elegant stepwise melody. The theme-and-variations format and graceful character point to Mozart's K. 331.",
      },
    ],
  },
]

export function sampleScoreQuestions(
  scores: ScoreExcerpt[],
  count: number,
): Array<{ score: ScoreExcerpt; question: AnalysisQuestion; questionIndex: number }> {
  const all: Array<{ score: ScoreExcerpt; question: AnalysisQuestion; questionIndex: number }> = []
  for (const score of scores) {
    for (let i = 0; i < score.questions.length; i++) {
      all.push({ score, question: score.questions[i], questionIndex: i })
    }
  }
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, all.length))
}
