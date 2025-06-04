import { Camera, Mic, Plus, Send } from "lucide-react";
import { useState } from "react";

interface UniversalInputBarProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onVoiceCapture?: () => void;
  onMediaUpload?: () => void;
  placeholder?: string;
  className?: string;
}

export default function UniversalInputBar({
  onTextSubmit,
  onCameraCapture,
  onVoiceCapture,
  onMediaUpload,
  placeholder = "Add/edit anything...",
  className = ""
}: UniversalInputBarProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    setIsTyping(value.trim().length > 0);
    
    // Auto-resize textarea
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleSendMessage = () => {
    if (inputText.trim() && onTextSubmit) {
      onTextSubmit(inputText.trim());
      setInputText("");
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex items-end gap-1.5 bg-white rounded-2xl p-3 shadow-sm border border-gray-200 ${className}`}>
      <textarea
        value={inputText}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="flex-1 resize-none border-none outline-none text-gray-700 placeholder-gray-400 bg-transparent min-h-[20px] max-h-[120px]"
        rows={1}
        style={{ lineHeight: '1.25' }}
      />
      
      <div className="flex items-center gap-1.5">
        {isTyping ? (
          <>
            <button 
              onClick={onMediaUpload}
              className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSendMessage}
              className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onMediaUpload}
              className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onCameraCapture}
              className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#a8bfa1' }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              onClick={onVoiceCapture}
              className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: '#9bb8d3' }}
            >
              <Mic className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}