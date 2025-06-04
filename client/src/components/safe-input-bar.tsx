import { useState } from "react";
import { Camera, Mic, Send } from "lucide-react";

interface SafeInputBarProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onVoiceCapture?: () => void;
  placeholder?: string;
  className?: string;
}

export default function SafeInputBar({
  onTextSubmit,
  onCameraCapture,
  onVoiceCapture,
  placeholder = "Add/edit anything...",
  className = ""
}: SafeInputBarProps) {
  const [inputText, setInputText] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    // Auto-resize textarea
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleSendMessage = () => {
    if (inputText.trim() && onTextSubmit) {
      onTextSubmit(inputText.trim());
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm ${className}`}>
      <div className="flex items-end gap-2 p-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full resize-none border-0 bg-transparent text-base placeholder-gray-500 focus:outline-none focus:ring-0 min-h-[20px] max-h-[120px]"
            rows={1}
            style={{ lineHeight: '20px' }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Camera Button */}
          <button
            onClick={onCameraCapture}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: '#a8bfa1' }}
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Voice Button */}
          <button
            onClick={onVoiceCapture}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: '#9bb8d3' }}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          {inputText.trim() && (
            <button
              onClick={handleSendMessage}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors text-white ml-1"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}