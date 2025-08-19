import { useState } from 'react';
import AudioRecorder from './components/AudioRecorder';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import './App.css';

interface ChatMessage {
  userText: string;
  llmResponse: string;
  timestamp: number;
}

function App() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const handleNewMessage = (userText: string, llmResponse: string) => {
    const newMessage: ChatMessage = {
      userText,
      llmResponse,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleConnectionStatus = (status: string) => {
    setConnectionStatus(status);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎤 Health Assistant</h1>
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
            />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with React + Django + WebSockets</p>
      </footer>
    </div>
  );
}

export default App;
