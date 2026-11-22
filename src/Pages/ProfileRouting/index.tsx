import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import ProjectsPage from '../ProjectsPage'
import StudyHub from '../StudyPage'
import FlashcardMode from '../StudyPage/FlashcardMode'
import MultipleChoiceMode from '../StudyPage/MultipleChoiceMode'
import TypeInMode from '../StudyPage/TypeInMode'
import MatchingMode from '../StudyPage/MatchingMode'
import LearnMode from '../StudyPage/LearnMode'
import TestMode from '../StudyPage/TestMode'
import ExamPrepHub from '../ExamPrepPage'
import ExamSimulation from '../ExamPrepPage/ExamSimulation'
import AdvancedDrills from '../ExamPrepPage/AdvancedDrills'
import ComprehensiveQuiz from '../ExamPrepPage/ComprehensiveQuiz'
import ScoreAnalysis from '../ExamPrepPage/ScoreAnalysis'
import TodoPage from '../TodoPage'
import DeckGate from '../StudyPage/DeckGate'
import { useDeckAccountSync } from '../../hooks/useDeckAccountSync'

const ProfileRouting = () => {
  useDeckAccountSync()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/examples" element={<ExamplePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="/study/:deckId/flashcards" element={<DeckGate><FlashcardMode /></DeckGate>} />
      <Route path="/study/:deckId/quiz" element={<DeckGate><MultipleChoiceMode /></DeckGate>} />
      <Route path="/study/:deckId/type" element={<DeckGate><TypeInMode /></DeckGate>} />
      <Route path="/study/:deckId/match" element={<DeckGate><MatchingMode /></DeckGate>} />
      <Route path="/study/:deckId/learn" element={<DeckGate><LearnMode /></DeckGate>} />
      <Route path="/study/:deckId/test" element={<DeckGate><TestMode /></DeckGate>} />
      <Route path="/study/exam" element={<ExamPrepHub />} />
      <Route path="/study/exam/simulation" element={<ExamSimulation />} />
      <Route path="/study/exam/drills" element={<AdvancedDrills />} />
      <Route path="/study/exam/comprehensive" element={<ComprehensiveQuiz />} />
      <Route path="/study/exam/scores" element={<ScoreAnalysis />} />
      <Route path="/todo" element={<TodoPage />} />
      <Route path="*" element={<div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: '100vw', height: '100vh' }}>404 Not Found</div>} />
    </Routes>
  )
}

export default ProfileRouting
