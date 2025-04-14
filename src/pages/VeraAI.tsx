
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GradientAvatar, GradientAvatarFallback } from '@/components/ui/gradient-avatar';
import { ArrowLeft, Send, BarChart3, FileText, PieChart, LayoutGrid, Mic } from 'lucide-react';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  responseType?: ResponseType;
  chartData?: any;
}

type ResponseType = 'concise' | 'visual-charts' | 'deep-research' | 'canvas';

const VeraAI = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedResponseType, setSelectedResponseType] = useState<ResponseType>('concise');
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const firstName = user?.email?.split('@')[0] || 'User';
  
  // Add welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: '1',
        content: `Hello ${firstName}, I'm Vera. Ask me anything about your sales data.`,
        isUser: false,
        timestamp: new Date()
      }
    ]);
    
    // Focus the input field
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, [firstName]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
      responseType: selectedResponseType
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set loading state
    setInput('');
    setIsLoading(true);
    
    try {
      // Send data to webhook
      const response = await fetch('https://jethro5.app.n8n.cloud/webhook-test/be5ddac3-2938-4dfb-9e32-4f37f96a4c11', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: input,
          responseType: selectedResponseType,
          user: user?.email,
          timestamp: new Date()
        })
      });
      
      if (!response.ok) {
        throw new Error('Error connecting to service');
      }
      
      // Add a placeholder AI response for now
      // In a real scenario, you would use the actual response from the webhook
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getPlaceholderResponse(selectedResponseType, input),
        isUser: false,
        timestamp: new Date(),
        responseType: selectedResponseType
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message to webhook:', error);
      toast({
        title: "Error",
        description: "Failed to connect to AI service. Please try again.",
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

  // Generate placeholder responses based on response type (for demo purposes)
  const getPlaceholderResponse = (type: ResponseType, query: string): string => {
    switch(type) {
      case 'concise':
        return `Based on your sales data: ${query.includes('top') ? 'Your top performers are Craig (£32,500), Murray (£29,700), and James (£24,900).' : 'Overall profit increased by 12.7% compared to last month.'}`;
      case 'visual-charts':
        return 'Here\'s a visualization of the data:\n\n[Chart data would be displayed here based on the query. For a real implementation, this would include actual chart data.]';
      case 'deep-research':
        return 'After analyzing your sales data in detail:\n\n1. Sales in the REVA department have consistently outperformed projections for the past quarter.\n\n2. Craig\'s accounts show a 15% higher profit margin compared to company average.\n\n3. The recent improvement in wholesale performance correlates with the new pricing structure implemented in March.';
      case 'canvas':
        return 'I\'ve created a canvas view of the insights:\n\n• Profit trends show a positive trajectory\n• Account retention rate is 92%\n• New customer acquisition cost decreased by 18%\n• Opportunity areas include expanding the wholesale division';
      default:
        return 'I\'ve analyzed your data. Is there anything specific you\'d like to know?';
    }
  };
  
  const handleResponseTypeChange = (type: ResponseType) => {
    setSelectedResponseType(type);
  };
  
  const renderMessage = (message: Message) => {
    return (
      <div 
        key={message.id} 
        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!message.isUser && (
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
          </Avatar>
        )}
        
        <div 
          className={`max-w-[80%] ${
            message.isUser 
              ? 'bg-gradient-to-r from-finance-red to-rose-700 text-white' 
              : 'bg-gray-800 text-gray-100'
          } rounded-lg p-4 whitespace-pre-line`}
        >
          {message.content}
        </div>
        
        {message.isUser && (
          <GradientAvatar className="h-8 w-8 ml-2 flex-shrink-0 mt-1">
            <GradientAvatarFallback className="text-white text-xs">
              {firstName[0].toUpperCase()}
            </GradientAvatarFallback>
          </GradientAvatar>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pt-4 pb-20">
        {/* Header with navigation and profile */}
        <div className="flex justify-between items-center mb-8">
          <Link to="/rep-performance">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <UserProfileButton />
        </div>
        
        {/* Greeting Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            Hello, <span className="text-finance-red">{firstName}</span>
          </h1>
          <p className="mt-4 text-gray-400">
            Ask me anything about your sales performance data
          </p>
        </div>
        
        {/* Messages Container */}
        <div className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-sm rounded-lg border border-white/10 p-4 mb-6 h-[50vh] overflow-y-auto">
          <div className="space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
          
          {isLoading && (
            <div className="flex justify-start">
              <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
              </Avatar>
              <div className="bg-gray-800 text-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vera about your sales data..."
                className="py-6 pl-4 pr-12 bg-gray-800/50 backdrop-blur-sm border-gray-700 text-white rounded-xl shadow-lg"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 rounded-full bg-gradient-to-r from-finance-red to-rose-700 text-white"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Response Type Options */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant={selectedResponseType === 'concise' ? 'default' : 'ghost'} 
                size="sm"
                className={selectedResponseType === 'concise' ? 'bg-finance-red hover:bg-rose-700' : 'text-gray-300 hover:text-white'}
                onClick={() => handleResponseTypeChange('concise')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Concise
              </Button>
              
              <Button
                type="button"
                variant={selectedResponseType === 'visual-charts' ? 'default' : 'ghost'} 
                size="sm"
                className={selectedResponseType === 'visual-charts' ? 'bg-finance-red hover:bg-rose-700' : 'text-gray-300 hover:text-white'}
                onClick={() => handleResponseTypeChange('visual-charts')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Visual Charts
              </Button>
              
              <Button
                type="button"
                variant={selectedResponseType === 'deep-research' ? 'default' : 'ghost'} 
                size="sm"
                className={selectedResponseType === 'deep-research' ? 'bg-finance-red hover:bg-rose-700' : 'text-gray-300 hover:text-white'}
                onClick={() => handleResponseTypeChange('deep-research')}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Deep Research
              </Button>
              
              <Button
                type="button"
                variant={selectedResponseType === 'canvas' ? 'default' : 'ghost'} 
                size="sm"
                className={selectedResponseType === 'canvas' ? 'bg-finance-red hover:bg-rose-700' : 'text-gray-300 hover:text-white'}
                onClick={() => handleResponseTypeChange('canvas')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Canvas
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VeraAI;
