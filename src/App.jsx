import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './styles/tokens.css';
import './styles/globals.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
