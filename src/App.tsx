import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeamsPage from './pages/TeamsPage';
import TeamFormPage from './pages/TeamFormPage';

export default function App() {
  return (
    <BrowserRouter basename="/gokwik/pr-nudge-bot">
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900">PR Nudge Bot</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">GoKwik Internal</span>
        </nav>
        <Routes>
          <Route path="/" element={<TeamsPage />} />
          <Route path="/teams/new" element={<TeamFormPage />} />
          <Route path="/teams/:id/edit" element={<TeamFormPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
