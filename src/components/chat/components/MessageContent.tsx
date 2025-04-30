
import React from 'react';
import { parseMarkdownBold } from '../utils/markdownUtils';

interface MessageContentProps {
  content: string | React.ReactNode;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className="whitespace-pre-wrap">
      {typeof content === 'string' ? parseMarkdownBold(content) : content}
    </div>
  );
};

export default MessageContent;
