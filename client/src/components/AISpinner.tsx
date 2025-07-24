import React from 'react';

interface AISpinnerProps {
  message?: string;
  className?: string;
}

export const AISpinner: React.FC<AISpinnerProps> = ({ 
  message = "🤖 thinking...", 
  className = ""
}) => {
  return (
    <div className={`flex items-center space-x-2 text-gray-500 dark:text-gray-400 ${className}`}>
      <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
      <span className="text-sm">{message}</span>
    </div>
  );
};

export default AISpinner;