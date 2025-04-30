
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
}

const ChatInput = ({ 
  message, 
  setMessage, 
  handleSubmit, 
  handleKeyDown, 
  textareaRef, 
  isLoading 
}: ChatInputProps) => {
  
  const suggestedQuestions = [
    "Who are the top performers by profit?",
    "Compare February and March margins",
    "Show me Craig's most profitable customers",
    "Why did profit increase in April?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  return (
    <div className="border-t border-white/10 p-3">
      {!isLoading && message.length === 0 && (
        <div className="mb-2 flex gap-2 flex-wrap">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(question)}
              className="text-xs py-1 px-3 bg-gray-700/50 hover:bg-gray-600 text-gray-300 rounded-full transition-colors flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              {question}
            </button>
          ))}
        </div>
      )}
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
          className="h-10 w-10 rounded-full bg-gradient-to-r from-finance-red to-rose-700 text-white"
          disabled={isLoading || !message.trim()}
          onClick={handleSubmit}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
