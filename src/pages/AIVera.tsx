
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserProfileButton from '@/components/auth/UserProfileButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatMessage from '@/components/chat/ChatMessage';
import LoadingIndicator from '@/components/chat/LoadingIndicator';
import ChatInput from '@/components/chat/ChatInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { reformulateQuery, generateFollowUpQuestions } from '@/utils/aiAssistantUtils';
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
    <div className="min-h-screen bg-finance-darkBg text-white overflow-hidden">
      {/* App header - fixed position, app-like */}
      <header className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-b border-white/10 z-10">
        <div className="flex justify-between items-center px-4 h-14">
          <Link to="/rep-performance">
            <Button variant="ghost" className="text-white hover:bg-white/10 p-0 h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-finance-red to-finance-red/80 text-white">V</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-semibold">Vera AI</h1>
          </div>
          
          <div className="flex gap-2">
            <div className="flex items-center">
              <Switch 
                checked={enableAI} 
                onCheckedChange={setEnableAI} 
                id="ai-toggle"
                className="data-[state=checked]:bg-finance-red"
              />
              <Sparkles className={`h-4 w-4 ml-1 ${enableAI ? 'text-finance-red' : 'text-gray-500'}`} />
            </div>
            <UserProfileButton />
          </div>
        </div>
      </header>
      
      {/* Main chat container - adjusted for fixed header and footer */}
      <main className="flex flex-col h-screen pt-14 pb-16">
        {/* Messages section with improved styling */}
        <div className="flex-grow overflow-y-auto px-2 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className="animate-fade-in"
              >
                <ChatMessage 
                  message={msg} 
                  onExampleClick={handleExampleClick} 
                />
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-center py-4">
                <LoadingIndicator />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Fixed chat input at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 py-2 px-3">
          <div className="max-w-3xl mx-auto">
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
      </main>
    </div>
  );
};

export default AIVera;
