import { Routes, Route } from 'react-router'
import HomePage from '../HomePage'
import ExamplePage from '../ExamplePage'
import StudyHub from '../StudyPage'
import FlashcardMode from '../StudyPage/FlashcardMode'
import MultipleChoiceMode from '../StudyPage/MultipleChoiceMode'
import TypeInMode from '../StudyPage/TypeInMode'
import MatchingMode from '../StudyPage/MatchingMode'

const ProfileRouting = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/examples" element={<ExamplePage />} />
      <Route path="/study" element={<StudyHub />} />
      <Route path="/study/:deckId/flashcards" element={<FlashcardMode />} />
      <Route path="/study/:deckId/quiz" element={<MultipleChoiceMode />} />
      <Route path="/study/:deckId/type" element={<TypeInMode />} />
      <Route path="/study/:deckId/match" element={<MatchingMode />} />
      <Route path="*" element={<div style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', width: '100vw', height: '100vh' }}>404 Not Found</div>} />
    </Routes>
  )
}

export default ProfileRouting
