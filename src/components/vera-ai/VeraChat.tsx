
import React, { useState, useRef, useEffect } from 'react';
import { 
  SearchIcon, 
  SendIcon, 
  BarChart3, 
  FileText, 
  AlertCircle, 
  Plus, 
  Mic
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import ResponseTypeButton from './ResponseTypeButton';
import VeraMessage from './VeraMessage';

type ResponseType = 'concise' | 'visual' | 'deep-research';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: ResponseType;
}

const VeraChat: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Vera, your AI sales data assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [responseType, setResponseType] = useState<ResponseType>('concise');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userQuery = message;
    setMessage('');
    setIsLoading(true);
    
    try {
      // Send to our webhook function
      const { data, error } = await supabase.functions.invoke('vera-ai-webhook', {
        body: {
          message: userQuery,
          responseType,
          userData: {
            userId: user?.id,
            email: user?.email,
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Add assistant response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.message || "I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        type: responseType
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Error calling VeraAI webhook:', err);
      toast({
        title: "Error",
        description: "Failed to get response from Vera. Please try again.",
        variant: "destructive"
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to the server. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <VeraMessage
            key={msg.id}
            content={msg.content}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
            type={msg.type}
          />
        ))}
        
        {isLoading && (
          <div className="flex items-center">
            <div className="flex space-x-2 bg-gray-800 text-gray-100 rounded-xl p-4">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-white/10 p-4 bg-gray-900/70">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-gray-800 text-gray-400"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <ResponseTypeButton 
              icon={FileText} 
              label="Concise" 
              active={responseType === 'concise'} 
              onClick={() => setResponseType('concise')} 
            />
            
            <ResponseTypeButton 
              icon={BarChart3} 
              label="Visual Charts" 
              active={responseType === 'visual'} 
              onClick={() => setResponseType('visual')} 
            />
            
            <ResponseTypeButton 
              icon={SearchIcon} 
              label="Deep Research" 
              active={responseType === 'deep-research'} 
              onClick={() => setResponseType('deep-research')} 
            />
            
            <div className="ml-auto">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-gray-800 text-gray-400"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-end gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vera anything about your sales data..."
              className="min-h-[60px] resize-none bg-gray-800 border-gray-700 text-white rounded-xl"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-gradient-to-r from-finance-red to-rose-700 text-white"
              disabled={isLoading || !message.trim()}
            >
              <SendIcon className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VeraChat;
