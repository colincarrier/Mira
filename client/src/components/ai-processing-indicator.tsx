interface AIProcessingIndicatorProps {
  isProcessing: boolean;
  size?: 'sm' | 'md';
}

export default function AIProcessingIndicator({ isProcessing, size = 'sm' }: AIProcessingIndicatorProps) {
  if (!isProcessing) return null;

  const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
  const spacing = size === 'sm' ? 'space-x-0.5' : 'space-x-1';

  return (
    <div className={`flex items-center ${spacing}`}>
      <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${dotSize} bg-blue-500 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}