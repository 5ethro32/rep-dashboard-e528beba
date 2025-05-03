
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
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Vera..."
          className="min-h-[56px] max-h-28 resize-none bg-gray-800/90 border-gray-700 focus:border-gray-500 text-white rounded-2xl px-4 py-3"
          disabled={isLoading}
          style={{ paddingRight: '60px' }} // Make room for the send button
        />
        <Button 
          type="submit" 
          size="icon" 
          className="h-10 w-10 rounded-full absolute right-4 bottom-4 bg-finance-red hover:bg-finance-red/90 text-white flex items-center justify-center border-none"
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
