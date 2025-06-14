import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatMessage from '@/components/chat/ChatMessage';
import LoadingIndicator from '@/components/chat/LoadingIndicator';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { reformulateQuery } from '@/utils/aiAssistantUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';

// Reuse interface definitions from ChatInterface
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  examples?: string[];
  chartData?: any;
  chartType?: 'bar' | 'line' | 'pie';
  tableData?: any[];
  tableHeaders?: string[];
  insights?: string[];
  trends?: {
    type: 'up' | 'down' | 'neutral';
    value: string;
    description: string;
  }[];
  highlightedEntities?: {
    type: 'rep' | 'customer' | 'department' | 'metric';
    name: string;
    value: string;
  }[];
  aiAnalysisUsed?: boolean;
}

interface ConversationContext {
  conversationId: string;
  history: Array<{role: string, content: string}>;
  selectedMonth: string;
}

const AIVera = () => {
  // Set dynamic page title
  usePageTitle();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('April');
  const [enableAI, setEnableAI] = useState<boolean>(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    conversationId: `vera-${Date.now()}`,
    history: [],
    selectedMonth
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Determine the user's first name for the greeting
  let userFirstName = user?.email?.split('@')[0] || 'User';
  // Capitalise first letter
  userFirstName = userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);
  
  // Set initial welcome message
  useEffect(() => {
    setMessages([
      { 
        id: '1', 
        content: `Hello, ${userFirstName}! I'm Vera, your sales data assistant. I'm still in development, but ask me about the performance of your sales, departments, or specific customers.`, 
        isUser: false, 
        timestamp: new Date(),
        insights: [
          "April saw a 3.8% increase in overall profit compared to March",
          "Jonny Cunningham showed the biggest margin improvement",
          "The Wholesale department has the highest margin at 20.7%"
        ]
      }
    ]);
  }, [userFirstName]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleExampleClick = (exampleText: string) => {
    setMessage(exampleText);
    
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Reformulate vague queries for better responses
    const userQuery = message;
    const enhancedQuery = reformulateQuery(userQuery);
    const isReformulated = enhancedQuery !== userQuery;
    
    setMessage('');
    setIsLoading(true);
    
    // Update conversation history with the user's new message
    const updatedHistory = [
      ...conversationContext.history,
      { role: 'user', content: userQuery }
    ];
    
    setConversationContext(prev => ({
      ...prev,
      history: updatedHistory
    }));
    
    try {
      // Detect if the query might benefit from AI analysis
      const mightNeedAI = userQuery.toLowerCase().includes('why') || 
                         userQuery.toLowerCase().includes('explain') ||
                         userQuery.toLowerCase().includes('reason');
      
      // Check if the user might benefit from AI but has it disabled
      if (mightNeedAI && !enableAI) {
        // Show a notification that AI analysis might be helpful
        toast({
          title: "AI Analysis Available",
          description: "This question might benefit from AI analysis. Consider enabling the AI toggle above.",
          action: <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEnableAI(true)}
            className="bg-finance-red/10 text-finance-red border-finance-red/20"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Enable AI
          </Button>
        });
      }
      
      // Call Supabase Edge Function with the full conversation context
      const { data, error } = await supabase.functions.invoke('rep-chat', {
        body: {
          message: isReformulated ? enhancedQuery : userQuery,
          originalMessage: userQuery,
          selectedMonth,
          enableAI, // Pass the AI toggle state to the edge function
          conversationContext: {
            conversationId: conversationContext.conversationId,
            history: updatedHistory
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Check if AI analysis was used
      const aiAnalysisUsed = data?.aiAnalysisUsed || false;
      
      // Add assistant response to chat with any visualization data and enhanced fields
      // But NO examples (follow-up questions) as they are only for the welcome message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.response || "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        chartData: data?.chartData,
        chartType: data?.chartType,
        tableData: data?.tableData,
        tableHeaders: data?.tableHeaders,
        insights: data?.insights,
        trends: data?.trends,
        highlightedEntities: data?.highlightedEntities,
        aiAnalysisUsed
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Update conversation history with the assistant's response
      setConversationContext(prev => ({
        ...prev,
        history: [
          ...updatedHistory,
          { role: 'assistant', content: data?.response || "" }
        ]
      }));
      
    } catch (err) {
      console.error('Error calling chat function:', err);
      toast({
        title: "Error",
        description: "Failed to get response from assistant. Please try again.",
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
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-finance-darkBg text-white bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="mb-4 pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-finance-red to-finance-red/80 text-white">V</AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">Vera AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">AI Analysis</span>
              <div className="flex items-center gap-1">
                <Switch 
                  checked={enableAI} 
                  onCheckedChange={setEnableAI} 
                  id="ai-toggle"
                />
                <Sparkles className={`h-4 w-4 ${enableAI ? 'text-finance-red' : 'text-gray-500'}`} />
              </div>
            </div>
          </div>
          <p className="text-white/60">
            Your sales data assistant. Ask me anything about your sales performance.
          </p>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-220px)] border border-white/10 rounded-lg">
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onExampleClick={handleExampleClick} 
              />
            ))}
            
            {isLoading && <LoadingIndicator />}
            
            <div ref={messagesEndRef} />
          </div>
          
          <ChatInput 
            message={message}
            setMessage={setMessage}
            handleSubmit={handleSubmit}
            handleKeyDown={handleKeyDown}
            textareaRef={textareaRef}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AIVera;
