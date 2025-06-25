import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import SetupPage from './pages/SetupPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Layout from './components/Layout';
import { connectWebSocket, disconnectWebSocket } from './services/webSocketService';

function App() {
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;