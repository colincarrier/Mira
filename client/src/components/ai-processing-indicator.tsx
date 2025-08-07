import { X } from 'lucide-react';

interface AIProcessingIndicatorProps {
  isProcessing: boolean;
  size?: 'sm' | 'md';
  position?: 'inline' | 'fixed';
  message?: string;
  onStop?: () => void;
}

export default function AIProcessingIndicator({ 
  isProcessing, 
  size = 'sm', 
  position = 'inline',
  message = 'Updating',
  onStop
}: AIProcessingIndicatorProps) {
  if (!isProcessing) return null;

  if (position === 'fixed') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">{message}</span>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        {onStop && (
          <button
            onClick={onStop}
            className="ml-2 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Stop processing"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    );
  }

  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const spacing = size === 'sm' ? 'space-x-0.5' : 'space-x-1';

  return (
    <div className={`flex items-center gap-2`}>
      {message && <span className="text-sm text-gray-600">{message}</span>}
      <div className={`flex items-center ${spacing}`}>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
        <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
      </div>
      {onStop && (
        <button
          onClick={onStop}
          className="ml-1 p-0.5 rounded hover:bg-gray-100 transition-colors"
          title="Stop"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      )}
    </div>
  );
}