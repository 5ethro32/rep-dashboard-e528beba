
import React from 'react';

interface HighlightedEntity {
  type: 'rep' | 'customer' | 'department' | 'metric';
  name: string;
  value: string;
}

interface MessageHighlightedEntitiesProps {
  entities: HighlightedEntity[];
}

const MessageHighlightedEntities: React.FC<MessageHighlightedEntitiesProps> = ({ entities }) => {
  if (!entities || entities.length === 0) return null;
  
  return (
    <div className="mt-4 mb-2 flex flex-wrap gap-2">
      {entities.map((entity, index) => (
        <div 
          key={index} 
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            entity.type === 'rep' ? 'bg-blue-500/20 text-blue-300' : 
            entity.type === 'customer' ? 'bg-green-500/20 text-green-300' : 
            entity.type === 'department' ? 'bg-purple-500/20 text-purple-300' : 
            'bg-amber-500/20 text-amber-300'
          }`}
        >
          {entity.name}: {entity.value}
        </div>
      ))}
    </div>
  );
};

export default MessageHighlightedEntities;
