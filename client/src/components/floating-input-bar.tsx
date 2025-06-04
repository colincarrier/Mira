import { useState, useRef } from "react";
import SafeInputBar from "./safe-input-bar";

interface FloatingInputBarProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onNewNote: () => void;
  isHidden?: boolean;
}

export default function FloatingInputBar({ 
  onTextSubmit, 
  onCameraCapture, 
  onNewNote, 
  isHidden = false 
}: FloatingInputBarProps) {
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const handleTextSubmit = (text: string) => {
    if (text.trim()) {
      if (onTextSubmit) {
        onTextSubmit(text);
      } else {
        // Fallback to creating a new note
        onNewNote();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = Math.abs(touchEnd.y - touchStart.y);
    
    // Swipe right to hide (minimum 50px horizontal, max 30px vertical)
    if (deltaX > 50 && deltaY < 30) {
      setIsAddButtonHidden(true);
    }
    // Swipe left to show
    else if (deltaX < -50 && deltaY < 30) {
      setIsAddButtonHidden(false);
    }
    
    setTouchStart(null);
  };

  if (isHidden) return null;

  return (
    <>
      {/* Floating input bar above navigation */}
      <div 
        ref={addButtonRef}
        className={`fixed left-4 right-4 transition-transform duration-300 ${
          isAddButtonHidden ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          bottom: 'calc(6rem + 2px)',
          left: '1rem',
          right: '1rem'
        }}
      >
        <SafeInputBar
          onTextSubmit={handleTextSubmit}
          onCameraCapture={onCameraCapture}
          onVoiceCapture={() => {}}
          placeholder="Add/edit anything..."
        />
      </div>

      {/* Hidden state indicator - tap to restore */}
      {isAddButtonHidden && (
        <div 
          className="fixed bottom-24 right-4 cursor-pointer"
          onClick={() => setIsAddButtonHidden(false)}
          style={{ zIndex: 10000 }}
        >
          <div className="w-12 h-6 bg-gray-400/50 rounded-full flex items-center justify-center">
            <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
    </>
  );
}