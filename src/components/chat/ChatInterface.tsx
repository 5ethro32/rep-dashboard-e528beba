import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  examples?: string[]; // Added examples property for prompt messages
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
      content: "Hello! I'm Vera, your sales data assistant. Ask me anything about rep performance data.", 
      isUser: false, 
      timestamp: new Date(),
      examples: [
        "Who are the top performers?",
        "Tell me about Craig's sales"
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  
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
    
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('rep-chat', {
        body: {
          message: userQuery,
          selectedMonth
        }
      });

      if (error) throw new Error(error.message);
      
      // Add assistant response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data?.reply || "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
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
    <div className="fixed bottom-0 right-4 z-50 w-96 bg-gray-900/90 backdrop-blur-lg border border-white/10 rounded-t-lg shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center p-3 rounded-none rounded-t-lg bg-gradient-to-r from-rose-500 to-finance-red text-white"
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
          <div className="flex flex-col h-96">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!msg.isUser && (
                    <Avatar className="h-8 w-8 mr-2 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-finance-red text-white text-xs">V</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex flex-col max-w-[75%]">
                    <div 
                      className={`rounded-lg p-3 ${
                        msg.isUser 
                          ? 'bg-gradient-to-r from-rose-500 to-finance-red text-white' 
                          : 'bg-gray-800 text-gray-100'
                      } whitespace-pre-line`}
                    >
                      {msg.content}
                    </div>
                    
                    {msg.examples && msg.examples.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.examples.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(example)}
                            className="px-3 py-1.5 text-sm bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-full transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {msg.isUser && (
                    <Avatar className="h-8 w-8 ml-2 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-finance-red text-white text-xs">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
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
              
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Vera about your sales data..."
                  className="min-h-[60px] resize-none bg-gray-800 border-gray-700 text-white"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-finance-red text-white"
                  disabled={isLoading || !message.trim()}
                >
                  <SendIcon className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChatInterface;
