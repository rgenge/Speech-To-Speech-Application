import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './AudioRecorder.css';

interface AudioRecorderProps {
  onNewMessage: (userText: string, llmResponse: string) => void;
  onConnectionStatus: (status: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onNewMessage, 
  onConnectionStatus 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const { accessToken } = useAuth();
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (accessToken) {
      connectWebSocket();
    }
    
    return () => {
      disconnect();
    };
  }, [accessToken]);

  const connectWebSocket = () => {
    try {
      if (!accessToken) {
        setConnectionStatus('Authentication required');
        onConnectionStatus('Authentication required');
        return;
      }

      const wsUrl = `ws://localhost:8000/ws/audio/?token=${accessToken}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('Connected');
        onConnectionStatus('Connected');
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection_established':
              console.log('Connection established:', data.message);
              break;
            case 'transcription':
              if (data.text && data.llm_response) {
                onNewMessage(data.text, data.llm_response);
              }
              break;
            case 'recording_started':
              console.log('Recording started:', data.message);
              break;
            case 'recording_stopped':
              console.log('Recording stopped:', data.message);
              break;
            case 'error':
              console.error('WebSocket error:', data.message);
              break;
            default:
              console.log('Unknown message type:', data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
        onConnectionStatus('Error');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        onConnectionStatus('Disconnected');
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds if we have a token
        setTimeout(() => {
          if (!isConnected && accessToken) {
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('Failed to connect');
      onConnectionStatus('Failed to connect');
    }
  };

  const disconnect = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecording();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const startRecording = async () => {
    try {
      if (!isConnected) {
        alert('WebSocket not connected. Please wait for connection.');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        sendAudioData(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Send start recording signal
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_recording',
          timestamp: Date.now()
        }));
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please ensure you have given permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Send stop recording signal
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'stop_recording',
          timestamp: Date.now()
        }));
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const sendAudioData = async (audioBlob: Blob) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const audioData = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix

          wsRef.current!.send(JSON.stringify({
            type: 'audio_data',
            audio_data: audioData,
            timestamp: Date.now()
          }));
        };
        reader.readAsDataURL(audioBlob);
      }
    } catch (error) {
      console.error('Error sending audio data:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusIcon = () => {
    if (connectionStatus === 'Connected') {
      return <Wifi size={16} className="status-icon connected" />;
    } else if (connectionStatus === 'Authentication required') {
      return <AlertCircle size={16} className="status-icon error" />;
    } else {
      return <WifiOff size={16} className="status-icon disconnected" />;
    }
  };

  return (
    <div className="audio-recorder">
      <div className="status-bar">
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {getStatusIcon()}
          <span>{connectionStatus}</span>
        </div>
      </div>
      
      <div className="recorder-controls">
        <button
          className={`mic-button ${isRecording ? 'recording' : ''} ${!isConnected ? 'disabled' : ''}`}
          onClick={toggleRecording}
          disabled={!isConnected}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <div className="mic-icon">
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </div>
        </button>
      </div>
      
      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse"></div>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
