import React, { useEffect, useRef } from 'react';
import './TranscriptionDisplay.css';

interface ChatMessage {
  userText: string;
  llmResponse: string;
  timestamp: number;
}

interface TranscriptionDisplayProps {
  chatMessages: ChatMessage[];
  connectionStatus: string;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  chatMessages, 
  connectionStatus 
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new message is added
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    });
  };

  const downloadChat = () => {
    const allText = chatMessages.map(message => 
      `[${formatTimestamp(message.timestamp)}]\nUser: ${message.userText}\nAssistant: ${message.llmResponse}\n`
    ).join('\n');
    
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="transcription-display">
      <div className="transcription-header">
        <h2>💬 Chat</h2>
        <div className="transcription-controls">
          <button 
            className="control-btn download-btn"
            onClick={downloadChat}
            disabled={chatMessages.length === 0}
            title="Download chat history"
          >
            📥 Download
          </button>
        </div>
      </div>

      <div className="transcription-content">
        {chatMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <p>Start speaking to begin your conversation with the health assistant</p>
            <p className="connection-info">Status: {connectionStatus}</p>
          </div>
        ) : (
          <div className="chat-list">
            {chatMessages.map((message, index) => (
              <div key={index} className="chat-conversation">
                {/* User Message */}
                <div className="chat-message user-message">
                  <div className="message-avatar">👤</div>
                  <div className="message-content">
                    <div className="message-meta">
                      <span className="sender-name">You</span>
                      <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(message.userText)}
                        title="Copy user message"
                      >
                        📋
                      </button>
                    </div>
                    <div className="message-text">{message.userText}</div>
                  </div>
                </div>

                {/* AI Response */}
                {message.llmResponse && (
                  <div className="chat-message ai-message">
                    <div className="message-avatar">🤖</div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="sender-name">Health Assistant</span>
                        <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(message.llmResponse)}
                          title="Copy AI response"
                        >
                          📋
                        </button>
                      </div>
                      <div className="message-text">{message.llmResponse}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionDisplay;
