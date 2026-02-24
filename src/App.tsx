import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import StudyMode from "./components/StudyMode";
import ReviewMode from "./components/ReviewMode";
import QuizMode from "./components/QuizMode";
import CardManager from "./components/CardManager";
import StatsPage from "./components/StatsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/study" replace />} />
          <Route path="/study" element={<StudyMode />} />
          <Route path="/review" element={<ReviewMode />} />
          <Route path="/quiz" element={<QuizMode />} />
          <Route path="/manage" element={<CardManager />} />
          <Route path="/stats" element={<StatsPage />} />
        </Routes>
      </main>
    </div>
  );
}
