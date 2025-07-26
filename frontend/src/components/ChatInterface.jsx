// frontend/src/components/ChatInterface.jsx
// Main chat interface for conversations with Future Me

import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Users, Clock } from 'lucide-react';
import { apiService } from '../services/api';

const ChatInterface = ({ userProfile, selectedPersona, onPersonaUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);
  const currentAge = userProfile?.demographics?.estimatedAge || 26;

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const speechRecognition = new webkitSpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';

      speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };

      speechRecognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(speechRecognition);
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hello! I'm your ${selectedPersona.age}-year-old self from the future. I've seen how our financial journey unfolds, and I'm here to share what I've learned. What would you like to know about your financial future?`,
        persona: selectedPersona,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedPersona.age]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await apiService.chatWithFutureMe(
        inputMessage.trim(),
        currentAge,
        selectedPersona.age,
        userProfile
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.response,
        persona: response.persona,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update persona characteristics if received
      if (response.persona) {
        onPersonaUpdate(prev => ({
          ...prev,
          characteristics: response.persona
        }));
      }

      // Text-to-speech for AI response
      speakMessage(response.response, selectedPersona.age);

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I couldn't respond right now. ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakMessage = (text, age) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Adjust voice characteristics based on age
      utterance.rate = age >= 60 ? 0.8 : age >= 40 ? 0.9 : 1.0;
      utterance.pitch = age >= 60 ? 0.8 : age >= 40 ? 0.9 : 1.0;
      
      speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startCouncilConversation = async () => {
    if (isLoading) return;

    const councilMessage = {
      id: Date.now(),
      type: 'user',
      content: "I'd like to hear from the Council of Yous about my biggest financial decision right now.",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, councilMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.generateCouncil(
        "What should I focus on most for my financial future?",
        userProfile
      );

      const councilResponse = {
        id: Date.now() + 1,
        type: 'council',
        content: response.conversation,
        participants: response.participants,
        timestamp: response.timestamp
      };

      setMessages(prev => [...prev, councilResponse]);

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Council conversation failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => {
    switch (message.type) {
      case 'user':
        return (
          <div key={message.id} className="message user-message">
            <div className="message-content">
              <p>{message.content}</p>
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );

      case 'ai':
        return (
          <div key={message.id} className="message ai-message">
            <div className="message-header">
              <div className="persona-info">
                <Clock size={16} />
                <span>Future Me at {selectedPersona.age}</span>
              </div>
            </div>
            <div className="message-content">
              <p>{message.content}</p>
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );

      case 'council':
        return (
          <div key={message.id} className="message council-message">
            <div className="message-header">
              <div className="persona-info">
                <Users size={16} />
                <span>Council of Yous</span>
              </div>
            </div>
            <div className="message-content council-content">
              <pre>{message.content}</pre>
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={message.id} className="message error-message">
            <div className="message-content">
              <p>{message.content}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const suggestedQuestions = [
    "Should I pay off my credit card debt or start investing?",
    "How did you manage to build wealth from where I am now?", 
    "What's the biggest financial mistake I should avoid?",
    "When did you buy your first home?",
    "How much should I be saving each month?",
    "What investment strategy worked best for you?"
  ];

  return (
    <div className="chat-interface">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="current-persona">
          <h3>Talking to Future Me at {selectedPersona.age}</h3>
          {selectedPersona.characteristics && (
            <p className="persona-title">{selectedPersona.characteristics.title}</p>
          )}
        </div>
        <button 
          className="council-button"
          onClick={startCouncilConversation}
          disabled={isLoading}
        >
          <Users size={16} />
          Council of Yous
        </button>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="message ai-message loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Future Me is thinking...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="suggested-questions">
          <h4>Try asking Future Me:</h4>
          <div className="questions-grid">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="suggestion-button"
                onClick={() => setInputMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask Future Me at ${selectedPersona.age} anything about your financial journey...`}
            disabled={isLoading}
            rows={1}
          />
          
          <div className="input-actions">
            <button
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={toggleVoiceInput}
              disabled={isLoading}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        
        {isListening && (
          <div className="voice-indicator">
            <div className="pulse"></div>
            <span>Listening... Speak now</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;