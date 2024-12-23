import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LostAndFound from './components/LostAndFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lost-and-found" element={<LostAndFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;