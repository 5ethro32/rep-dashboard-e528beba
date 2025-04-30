
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
      content: "Hello! I'm Vera, your sales data assistant. Ask me anything about February, March, or April 2025 performance data.", 
      isUser: false, 
      timestamp: new Date(),
      examples: [
        "Who are the top performers?",
        "Tell me about Craig's sales",
        "Compare February and March profit",
        "How did Murray perform in February vs March?",
        "Show me April's best reps by margin",
        "Why did profit drop last month?",
        "What insights can you share about our performance?",
        "Which products had the highest growth?",
        "Give me a summary of March sales",
        "Performance trends since February",
        "Who improved the most since last month?",
        "Show me data visualizations for top reps"
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
    const userQuery = message;
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
          message: userQuery,
          selectedMonth,
          conversationContext: {
            conversationId: conversationContext.conversationId,
            history: updatedHistory
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Add assistant response to chat with any visualization data
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.response || "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
        chartData: data?.chartData,
        chartType: data?.chartType,
        tableData: data?.tableData,
        tableHeaders: data?.tableHeaders
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
    <div className="flex flex-col h-96">
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
        <DrawerContent className="bg-gray-900/95 backdrop-blur-lg border border-white/10 p-0 max-h-[80vh]">
          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-finance-red to-rose-700 flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
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
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
              </Avatar>
              Vera
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
