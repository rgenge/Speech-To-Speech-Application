import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Download, Trash2, Copy, VolumeX, Volume2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './TranscriptionDisplay.css';

interface ChatMessage {
  userText: string;
  llmResponse: string;
  timestamp: number;
  id?: number;
}

interface TranscriptionDisplayProps {
  chatMessages: ChatMessage[];
  connectionStatus: string;
  isVoicePlaying: boolean;
  onStopVoice: () => void;
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ 
  chatMessages, 
  connectionStatus,
  isVoicePlaying,
  onStopVoice
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClearingConversations, setIsClearingConversations] = useState(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    // Auto-scroll to bottom when new message is added
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, conversationHistory]);

  useEffect(() => {
    // Load conversation history when component mounts
    loadConversationHistory();
  }, [accessToken]);

  const loadConversationHistory = async () => {
    if (!accessToken) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch('http://localhost:8000/api/conversations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedHistory = data.conversations.map((conv: any) => ({
          id: conv.id,
          userText: conv.user_text,
          llmResponse: conv.llm_response,
          timestamp: new Date(conv.created_at).getTime(),
        }));
        setConversationHistory(formattedHistory);
      } else {
        console.error('Failed to load conversation history');
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const clearConversations = async () => {
    if (!accessToken || !window.confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
      return;
    }

    setIsClearingConversations(true);
    try {
      const response = await fetch('http://localhost:8000/api/conversations/clear/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConversationHistory([]);
        console.log('Conversations cleared successfully');
      } else {
        console.error('Failed to clear conversations');
        alert('Failed to clear conversations. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing conversations:', error);
      alert('Error clearing conversations. Please try again.');
    } finally {
      setIsClearingConversations(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    });
  };

  const downloadChat = () => {
    // Combine current session messages and history for download
    const allMessages = [...conversationHistory, ...chatMessages];
    const allText = allMessages.map(message => 
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

  // Combine current session and history for display
  const allMessages = [...conversationHistory, ...chatMessages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="transcription-display">
      <div className="transcription-header">
        <div className="header-left">
          <MessageSquare size={20} />
          <h2>Chat History</h2>
        </div>
        <div className="transcription-controls">
          {isVoicePlaying && (
            <button 
              className="control-btn voice-control-btn"
              onClick={onStopVoice}
              title="Stop voice playback"
            >
              <VolumeX size={16} />
              Stop Voice
            </button>
          )}
          <button 
            className="control-btn refresh-btn"
            onClick={loadConversationHistory}
            disabled={isLoadingHistory}
            title="Refresh conversation history"
          >
            <RefreshCw size={16} className={isLoadingHistory ? 'spinning' : ''} />
            Refresh
          </button>
          <button 
            className="control-btn download-btn"
            onClick={downloadChat}
            disabled={allMessages.length === 0}
            title="Download chat history"
          >
            <Download size={16} />
            Download
          </button>
          <button 
            className="control-btn clear-btn"
            onClick={clearConversations}
            disabled={isClearingConversations || conversationHistory.length === 0}
            title="Clear all conversations"
          >
            <Trash2 size={16} />
            {isClearingConversations ? 'Clearing...' : 'Clear All'}
          </button>
        </div>
      </div>

      <div className="transcription-content">
        {allMessages.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} className="empty-icon" />
            <p>Start speaking to begin your conversation with the health assistant</p>
            <p className="connection-info">Status: {connectionStatus}</p>
            {isLoadingHistory && (
              <p className="loading-info">Loading conversation history...</p>
            )}
          </div>
        ) : (
          <div className="chat-list">
            {allMessages.map((message, index) => (
              <div key={message.id || `session-${index}`} className="chat-conversation">
                {/* User Message */}
                <div className="chat-message user-message">
                  <div className="message-avatar user-avatar">
                    <div className="avatar-icon">You</div>
                  </div>
                  <div className="message-content">
                    <div className="message-meta">
                      <span className="sender-name">You</span>
                      <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(message.userText)}
                        title="Copy user message"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <div className="message-text">{message.userText}</div>
                  </div>
                </div>

                {/* AI Response */}
                {message.llmResponse && (
                  <div className="chat-message ai-message">
                    <div className="message-avatar ai-avatar">
                      <div className="avatar-icon">AI</div>
                    </div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="sender-name">Health Assistant</span>
                        <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                        <div className="message-actions">
                          <button 
                            className="copy-btn"
                            onClick={() => copyToClipboard(message.llmResponse)}
                            title="Copy AI response"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            className="voice-btn"
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                speechSynthesis.cancel();
                                const utterance = new SpeechSynthesisUtterance(message.llmResponse);
                                utterance.rate = 0.9;
                                utterance.pitch = 1;
                                utterance.volume = 0.8;
                                speechSynthesis.speak(utterance);
                              }
                            }}
                            title="Play this message"
                          >
                            <Volume2 size={14} />
                          </button>
                        </div>
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
