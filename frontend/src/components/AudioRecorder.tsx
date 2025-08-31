import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMonitoringRef = useRef<boolean>(false);

  const SILENCE_THRESHOLD = 0.01;
  const SILENCE_DURATION = 2000;

  // Callback to guarantee stable function
  const stopRecording = useCallback(() => {
    console.log('stopRecording chamado, isRecording:', isRecording);

    // Silence monitoring flag
    isMonitoringRef.current = false;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop the MediaRecorder if it's recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
    }

    // Update state
    setIsRecording(false);

    // Send stop signal using WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_recording',
        timestamp: Date.now()
      }));
    }

    // Stop all tracks of the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track parada:', track.kind);
      });
      streamRef.current = null;
    }

    // Clean Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        console.log('AudioContext closed');
      });
      audioContextRef.current = null;
    }

    analyserRef.current = null;

  }, [isRecording]);

  const detectSilence = useCallback(() => {
    if (!analyserRef.current || !isMonitoringRef.current) {
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const sample = (dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / bufferLength);

    // If volume is down
    if (rms < SILENCE_THRESHOLD) {
      if (!silenceTimeoutRef.current) {
        console.log('Checking silence...');
        silenceTimeoutRef.current = setTimeout(() => {
          console.log('Silence detected for 2 seconds! Stopping recording...');
          stopRecording();
        }, SILENCE_DURATION);
      }
    } else {
      // If there's sound, cancel the silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }

    if (isMonitoringRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectSilence);
    }
  }, [stopRecording, SILENCE_THRESHOLD, SILENCE_DURATION]);

  // Function to initialize silence detection
  const startSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      console.log('Starting silence detection...');

      // Criar novo AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();

      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      isMonitoringRef.current = true;
      detectSilence();

    } catch (error) {
      console.error('Error initializing silence detection:', error);
    }
  }, [detectSilence]);

  useEffect(() => {
    if (accessToken) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [accessToken]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMonitoringRef.current = false;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      if (!accessToken) {
        setConnectionStatus('Authentication required');
        onConnectionStatus('Authentication required');
        return;
      }
      const backendIp = import.meta.env.VITE_BACKEND_IP;
      const wsUrl = `ws://${backendIp}/ws/audio/?token=${accessToken}`;
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
    if (isRecording) {
      stopRecording();
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

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

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start silence detection AFTER MediaRecorder starts
      setTimeout(() => {
        startSilenceDetection(stream);
      }, 100);

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

  const sendAudioData = async (audioBlob: Blob) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const audioData = base64Audio.split(',')[1];

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
    console.log('Toggle recording, current state:', isRecording);
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
          title={isRecording ? 'Stop recording (or wait 2s of silence)' : 'Start recording'}
        >
          <div className="mic-icon">
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </div>
        </button>
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <div className="pulse"></div>
          <span>Recording... (stops after 2s of silence)</span>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
