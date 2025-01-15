import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Send, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WebAgent = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const websocket = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const customerId = `web_${Math.random().toString(36).slice(2, 9)}`;
    websocket.current = new WebSocket(`ws://localhost:8000/ws/conversation/${customerId}`);
    
    websocket.current.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
    
    websocket.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      setMessages(prev => [...prev, { type: 'agent', content: response.response }]);
    };
    
    websocket.current.onerror = () => {
      setError('Connection error. Please try again later.');
      setIsConnected(false);
    };
    
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || !isConnected) return;
    
    setMessages(prev => [...prev, { type: 'user', content: inputText }]);
    
    try {
      websocket.current.send(JSON.stringify({
        message: inputText,
        context: {}
      }));
      setInputText('');
    } catch (err) {
      setError('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleVoiceInput = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Voice input is not supported in your browser.');
      return;
    }

    try {
      setIsRecording(!isRecording);
      if (!isRecording) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Voice recording implementation would go here
      }
    } catch (err) {
      setError('Failed to access microphone.');
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Sales Agent</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={handleVoiceInput}
              className={`p-2 rounded-full ${
                isRecording ? 'bg-red-500' : 'bg-gray-200'
              }`}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!isConnected || !inputText.trim()}
              className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebAgent;