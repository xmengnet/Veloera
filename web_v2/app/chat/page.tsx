'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useI18n } from '@/i18n';
import api from '@/lib/api';
import ProtectedRoute from '@/components/auth/protected-route';
import { Send, Trash2, Settings, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export default function ChatPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat settings
  const [settings, setSettings] = useState<ChatSettings>({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await api.get<string[]>('/api/models');
        
        if (response.success && response.data) {
          setAvailableModels(response.data);
          
          // Set default model if available
          if (response.data.length > 0) {
            setSettings(prev => ({ ...prev, model: response.data[0] }));
          }
        }
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    };
    
    fetchModels();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = { role: 'user', content: input };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/api/chat/completions', {
        model: settings.model,
        messages: [...messages, userMessage],
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        top_p: settings.top_p,
        frequency_penalty: settings.frequency_penalty,
        presence_penalty: settings.presence_penalty
      });
      
      if (response.success && response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.choices[0].message.content
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(response.message || t('errors.unknownError'));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearChat = () => {
    if (confirm(t('chat.clearConfirm'))) {
      setMessages([]);
    }
  };
  
  const handleSettingChange = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{t('chat.title')}</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-md hover:bg-muted"
              title={t('chat.settings.title')}
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button
              onClick={clearChat}
              className="p-2 rounded-md hover:bg-muted"
              title={t('chat.clearContext')}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">{t('chat.settings.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="model" className="block text-sm font-medium mb-1">
                  {t('chat.settings.model')}
                </label>
                <select
                  id="model"
                  value={settings.model}
                  onChange={(e) => handleSettingChange('model', e.target.value)}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium mb-1">
                  {t('chat.settings.temperature')} ({settings.temperature})
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium mb-1">
                  {t('chat.settings.maxTokens')}
                </label>
                <input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="4000"
                  value={settings.max_tokens}
                  onChange={(e) => handleSettingChange('max_tokens', parseInt(e.target.value))}
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="topP" className="block text-sm font-medium mb-1">
                  {t('chat.settings.topP')} ({settings.top_p})
                </label>
                <input
                  id="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.top_p}
                  onChange={(e) => handleSettingChange('top_p', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="frequencyPenalty" className="block text-sm font-medium mb-1">
                  {t('chat.settings.frequencyPenalty')} ({settings.frequency_penalty})
                </label>
                <input
                  id="frequencyPenalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={settings.frequency_penalty}
                  onChange={(e) => handleSettingChange('frequency_penalty', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="presencePenalty" className="block text-sm font-medium mb-1">
                  {t('chat.settings.presencePenalty')} ({settings.presence_penalty})
                </label>
                <input
                  id="presencePenalty"
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={settings.presence_penalty}
                  onChange={(e) => handleSettingChange('presence_penalty', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-card rounded-lg shadow p-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('chat.startPrompt')}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            disabled={isLoading}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
