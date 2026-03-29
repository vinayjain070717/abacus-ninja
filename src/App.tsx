import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import AdditionSubtraction from './pages/AdditionSubtraction';
import Multiplication from './pages/Multiplication';
import Division from './pages/Division';
import DailyWorksheet from './pages/DailyWorksheet';
import MemoryGames from './pages/MemoryGames';
import AbacusVisualizer from './pages/AbacusVisualizer';
import Tutorials from './pages/Tutorials';
import CustomWorksheet from './pages/CustomWorksheet';
import TimedChallenge from './pages/TimedChallenge';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Benefits from './pages/Benefits';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/addition" element={<AdditionSubtraction />} />
          <Route path="/multiplication" element={<Multiplication />} />
          <Route path="/division" element={<Division />} />
          <Route path="/worksheet" element={<DailyWorksheet />} />
          <Route path="/custom-worksheet" element={<CustomWorksheet />} />
          <Route path="/memory" element={<MemoryGames />} />
          <Route path="/abacus" element={<AbacusVisualizer />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/timed-challenge" element={<TimedChallenge />} />
          <Route path="/benefits" element={<Benefits />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
