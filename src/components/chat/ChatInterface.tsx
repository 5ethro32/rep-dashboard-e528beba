import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { reformulateQuery, determineQuestionType, generateFollowUpQuestions } from '@/utils/aiAssistantUtils';

// Import refactored components
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import LoadingIndicator from './LoadingIndicator';

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
}

interface ConversationContext {
  conversationId: string;
  history: Array<{role: string, content: string}>;
  selectedMonth: string;
}

interface ChatInterfaceProps {
  selectedMonth?: string;
}

const ChatInterface = ({ selectedMonth = 'March' }: ChatInterfaceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      content: "Hello! I'm Vera, your sales data assistant. Ask me about the performance of your sales representatives, departments, or specific customers across different months.", 
      isUser: false, 
      timestamp: new Date(),
      examples: [
        "Who are the top performers this month?",
        "Tell me about Craig's sales",
        "Compare February and March profit",
        "How did Murray perform in February vs March?",
        "Show me April's best reps by margin",
        "Why did profit drop last month?",
        "Which customers have the highest profit?",
        "Show me department comparison"
      ],
      insights: [
        "April saw a 3.8% increase in overall profit compared to March",
        "Jonny Cunningham showed the biggest margin improvement",
        "The Wholesale department has the highest margin at 20.7%"
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    conversationId: `vera-${Date.now()}`,
    history: [],
    selectedMonth
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when opening chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Update conversation context when selectedMonth changes
  useEffect(() => {
    setConversationContext(prev => ({
      ...prev,
      selectedMonth
    }));
  }, [selectedMonth]);

  const handleExampleClick = (exampleText: string) => {
    // Set the example text as the current message and submit
    setMessage(exampleText);
    
    // Use setTimeout to let the state update before submitting
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
      // Call Supabase Edge Function with the full conversation context
      const { data, error } = await supabase.functions.invoke('rep-chat', {
        body: {
          message: isReformulated ? enhancedQuery : userQuery,
          originalMessage: userQuery,
          selectedMonth,
          conversationContext: {
            conversationId: conversationContext.conversationId,
            history: updatedHistory
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Generate follow-up suggestions based on the conversation
      const questionType = data?.questionType || 'general';
      const entities = data?.entities || { months: [selectedMonth], repNames: [], departments: [], metrics: [] };
      const followUps = generateFollowUpQuestions(questionType, entities, selectedMonth);
      
      // Add assistant response to chat with any visualization data and enhanced fields
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
        examples: followUps
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

  const renderChatContent = () => (
    <div className="flex flex-col h-[500px]">
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
  );

  // Mobile version uses a floating button with a drawer
  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button 
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-r from-finance-red to-rose-700 text-white shadow-lg z-50 flex items-center justify-center"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-gray-900/95 backdrop-blur-lg border border-white/10 p-0 max-h-[90vh]">
          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-finance-red to-rose-700 flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="bg-gradient-to-r from-finance-red to-finance-red/80 text-white text-xs">V</AvatarFallback>
            </Avatar>
            <span className="font-medium text-white">Vera</span>
          </div>
          {renderChatContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version uses the existing collapsible panel
  return (
    <div className="fixed bottom-0 right-4 z-50 w-96 bg-gray-900/90 backdrop-blur-lg border border-white/10 rounded-t-lg shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center p-3 rounded-none rounded-t-lg bg-gradient-to-r from-finance-red to-rose-700 text-white"
          >
            <span className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback className="bg-gradient-to-r from-finance-red to-finance-red/80 text-white text-xs">V</AvatarFallback>
              </Avatar>
              Vera - Sales Assistant
            </span>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {renderChatContent()}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChatInterface;
