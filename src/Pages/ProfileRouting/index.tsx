import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import ProjectsPage from '../ProjectsPage'
import StudyHub from '../StudyPage'
import FlashcardMode from '../StudyPage/FlashcardMode'
import MultipleChoiceMode from '../StudyPage/MultipleChoiceMode'
import TypeInMode from '../StudyPage/TypeInMode'
import MatchingMode from '../StudyPage/MatchingMode'
import ExamPrepHub from '../ExamPrepPage'
import ExamSimulation from '../ExamPrepPage/ExamSimulation'
import AdvancedDrills from '../ExamPrepPage/AdvancedDrills'
import ComprehensiveQuiz from '../ExamPrepPage/ComprehensiveQuiz'
import ScoreAnalysis from '../ExamPrepPage/ScoreAnalysis'

const ProfileRouting = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/examples" element={<ExamplePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="/study/:deckId/flashcards" element={<FlashcardMode />} />
      <Route path="/study/:deckId/quiz" element={<MultipleChoiceMode />} />
      <Route path="/study/:deckId/type" element={<TypeInMode />} />
      <Route path="/study/:deckId/match" element={<MatchingMode />} />
      <Route path="/study/exam" element={<ExamPrepHub />} />
      <Route path="/study/exam/simulation" element={<ExamSimulation />} />
      <Route path="/study/exam/drills" element={<AdvancedDrills />} />
      <Route path="/study/exam/comprehensive" element={<ComprehensiveQuiz />} />
      <Route path="/study/exam/scores" element={<ScoreAnalysis />} />
      <Route path="*" element={<div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: '100vw', height: '100vh' }}>404 Not Found</div>} />
    </Routes>
  )
}

export default ProfileRouting
