
import React, { RefObject, FormEvent } from 'react';
import { SendIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    { id: 'default', name: 'Vera Standard' },
    { id: 'enhanced', name: 'Vera Enhanced' }
  ];
  
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
          <div className="flex justify-between items-center px-1 pt-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <select 
                value={selectedModel || 'default'} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none text-xs text-gray-400 focus:outline-none cursor-pointer"
              >
                {models.map(model => (
                  <option key={model.id} value={model.id} className="bg-gray-800 text-white">
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-500">Lovable Labs</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
