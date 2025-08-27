import { useState } from 'react';
import { Mic2, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AudioRecorder from './components/AudioRecorder';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import LoginScreen from './components/LoginScreen';
import './App.css';

interface ChatMessage {
  userText: string;
  llmResponse: string;
  timestamp: number;
}

const AppContent: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const { user, logout } = useAuth();

  const handleNewMessage = (userText: string, llmResponse: string) => {
    const newMessage: ChatMessage = {
      userText,
      llmResponse,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
    
    // Text-to-speech for LLM response
    if (llmResponse && 'speechSynthesis' in window) {
      setTimeout(() => {
        setIsVoicePlaying(true);
        const utterance = new SpeechSynthesisUtterance(llmResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          setIsVoicePlaying(false);
        };
        
        utterance.onerror = () => {
          setIsVoicePlaying(false);
        };
        
        speechSynthesis.speak(utterance);
      }, 500); // Small delay to let the UI update first
    }
  };

  const handleConnectionStatus = (status: string) => {
    setConnectionStatus(status);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsVoicePlaying(false);
    }
  };

  const handleLogout = () => {
    logout();
    setChatMessages([]);
    setConnectionStatus('Disconnected');
    handleStopVoice(); // Stop any playing voice
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <Mic2 size={32} className="app-icon" />
            <h1>Health Assistant</h1>
          </div>
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <div className="recorder-section">
            <AudioRecorder 
              onNewMessage={handleNewMessage}
              onConnectionStatus={handleConnectionStatus}
            />
          </div>
          
          <div className="chat-section">
            <TranscriptionDisplay 
              chatMessages={chatMessages}
              connectionStatus={connectionStatus}
              isVoicePlaying={isVoicePlaying}
              onStopVoice={handleStopVoice}
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React + Django + WebSockets</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
