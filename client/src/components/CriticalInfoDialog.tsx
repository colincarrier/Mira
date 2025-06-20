import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CriticalInfoDialogProps {
  question: string;
  onDismiss: () => void;
  onAnswer: (answer: string) => void;
}

export const CriticalInfoDialog: React.FC<CriticalInfoDialogProps> = ({
  question,
  onDismiss,
  onAnswer
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      onAnswer(answer.trim());
      setAnswer('');
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 pointer-events-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 mb-2">{question}</p>
            <form onSubmit={handleSubmit}>
              <input 
                className="w-full px-2 py-1 border border-yellow-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="Quick answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e as any)}
                autoFocus
              />
            </form>
          </div>
          <button 
            onClick={onDismiss} 
            className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Arrow pointing to input bar */}
        <div className="absolute -bottom-2 left-6 w-4 h-4 bg-yellow-50 border-r border-b border-yellow-200 transform rotate-45"></div>
      </div>
    </div>
  );
};