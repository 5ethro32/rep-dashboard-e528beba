
import React, { RefObject, FormEvent } from 'react';
import { SendIcon } from 'lucide-react';
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
  return (
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
          className="h-10 w-10 rounded-full bg-gradient-to-r from-finance-red to-rose-700 text-white"
          disabled={isLoading || !message.trim()}
        >
          <SendIcon className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
