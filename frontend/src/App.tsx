import { useState } from 'react';
import { Mic2, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AudioRecorder from './components/AudioRecorder';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import LoginScreen from './components/LoginScreen';
import './App.css';
import { createPortal } from 'react-dom';

interface ChatMessage {
  userText: string;
  llmResponse: string;
  timestamp: number;
}
const backendIp = import.meta.env.VITE_BACKEND_IP;
const AppContent: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const { user, accessToken, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newProfile, setNewProfile] = useState("");

  const handleChangeProfile = async () => {
  if (!newProfile.trim()) {
    alert("Please enter your personal information");
    return;
  }

  try {
    const res = await fetch(`${backendIp}/api/update-social-number/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ profile: newProfile })
    });

    const data = await res.json();
    if (res.ok) {
      alert("Profile info updated successfully!");
      setShowProfileModal(false); // Close modal after success
      setNewProfile(''); // Clear the input
    } else {
      alert(data.error || "Failed to update profile info");
      // Keep modal open so user can try again
    }
  } catch (err) {
    console.error(err);
    alert("Network error while updating profile info");
  }
};


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
			<div className="user-info">
  <span>Welcome, {user.name}</span>
  <button onClick={() => setShowProfileModal(true)} className="change-social-box">
  Update Personal Details
</button>
{showProfileModal && createPortal(
  <div
    className="modal-overlay"
    onClick={() => setShowProfileModal(false)}
  >
    <div
      className="modal-box"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Update Personal Details</h2>
      <textarea
		placeholder="Enter personal details eg. Name:John Kennedy, Age: 30, Social Number 12345, Insurance Company: AIG (up to 1000 characters)"
		value={newProfile}
		onChange={(e) => setNewProfile(e.target.value)}
		maxLength={1000} // Enforce 1000 char limit
		rows={6} // Number of visible lines
		style={{ resize: 'vertical' }} // Allow user to resize vertically
		/>
      <div className="modal-actions">
        <button
          className="modal-btn cancel"
          onClick={() => setShowProfileModal(false)}
        >
          Cancel
        </button>
        <button
          className="modal-btn confirm"
          onClick={handleChangeProfile}
        >
          Save
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
  <button onClick={handleLogout} className="logout-button">
    <LogOut size={16} />
    Logout
  </button>
</div>

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
