
import React, { RefObject, FormEvent, useState } from 'react';
import { SendIcon, Sparkles, Cpu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSubmit: (e: FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  isLoading: boolean;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

const ChatInput = ({ 
  message, 
  setMessage, 
  handleSubmit, 
  handleKeyDown, 
  textareaRef, 
  isLoading,
  selectedModel,
  setSelectedModel
}: ChatInputProps) => {
  
  const suggestedQuestions = [
    "Who are the top performers by profit?",
    "Show me Craig's most profitable customers",
    "Show me April's best reps by margin",
    "Why did profit increase in April?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const models = [
    { id: 'default', name: 'Vera Standard', description: 'Our standard model for everyday tasks' },
    { id: 'enhanced', name: 'Vera Enhanced', description: 'Our most intelligent model yet', new: false },
    { id: 'basic', name: 'Vera Basic', description: 'Fastest model for simple queries', new: true }
  ];
  
  // Find the current model name
  const currentModel = models.find(m => m.id === (selectedModel || 'default'));
  
  return (
    <div className="w-full">
      {!isLoading && message.length === 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(question)}
              className="text-xs py-2 px-3 bg-gray-800/90 hover:bg-gray-700 text-white rounded-full transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0"
            >
              <Sparkles className="h-3 w-3 text-finance-red" />
              {question}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex items-center w-full relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Vera..."
            className="min-h-[50px] max-h-24 resize-none bg-gray-800/90 border-gray-700 focus:border-gray-500 text-white rounded-2xl px-4 pt-3 pb-3 pr-16"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-3 h-10 w-10 rounded-full bg-finance-red hover:bg-finance-red/90 text-white flex items-center justify-center border-none top-1/2 transform -translate-y-1/2 z-10"
            disabled={isLoading || !message.trim()}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
        
        {setSelectedModel && (
          <div className="flex justify-between items-center px-1 pt-2 text-xs">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 bg-gray-800/60 rounded-full px-3 py-1.5 border border-gray-700/50 hover:bg-gray-700/60 transition-colors">
                  <Cpu className="h-3 w-3 text-finance-red" />
                  <span className="text-xs text-white">{currentModel?.name || 'Vera Standard'}</span>
                  <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 bg-gray-800 border-gray-700 text-white">
                <div className="py-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`px-4 py-2 flex flex-col hover:bg-gray-700 cursor-pointer ${model.id === selectedModel ? 'bg-gray-700/50' : ''}`}
                      onClick={() => setSelectedModel && setSelectedModel(model.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{model.name}</span>
                        {model.id === selectedModel && (
                          <span className="text-blue-400">✓</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{model.description}</span>
                      {model.new && (
                        <span className="text-xs mt-1 bg-gray-700 text-white px-2 py-0.5 rounded-full w-fit">
                          New chat
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="text-xs text-gray-500">Lovable Labs</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
