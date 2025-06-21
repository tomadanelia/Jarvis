// packages/frontend/src/App.tsx
import { useEffect } from 'react'; // Import useEffect
import './App.css';
import SetupPage from './pages/SetupPage';
import { connectWebSocket, disconnectWebSocket } from './services/webSocketService'; // Import

function App() {
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, []); 
  return (
    <SetupPage /> 
  );
}

export default App;