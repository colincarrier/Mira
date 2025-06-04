import { useState } from 'react';
import { Camera, Mic, X, Send, ArrowLeft } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('text');
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const { createNote } = useNotes();

  const handleSendNote = async () => {
    if (!noteText.trim() && !noteTitle.trim()) return;
    
    try {
      await createNote.mutateAsync({
        content: noteText || noteTitle,
        mode: 'quick'
      });
      
      setNoteText('');
      setNoteTitle('');
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[40] bg-black">
      {/* Text Mode */}
      {captureMode === 'text' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Notes</span>
            </button>
            
            <button
              onClick={handleSendNote}
              disabled={!noteText.trim() && !noteTitle.trim()}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0056CC] transition-colors"
            >
              Done
            </button>
          </div>

          {/* iOS Notes-style editor */}
          <div 
            className="flex-1 overflow-hidden"
            style={{ paddingBottom: `${keyboardHeight}px` }}
          >
            <div className="p-4 h-full">
              {/* Title */}
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-2"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              />
              
              {/* Date */}
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              
              {/* Content */}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start writing..."
                className="w-full h-full resize-none border-none outline-none bg-transparent text-base leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: '1.6'
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Bottom floating controls */}
          <div className="absolute bottom-6 left-4 right-4 z-[200]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCaptureMode('camera')}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCaptureMode('voice')}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCaptureMode('text')}
                  className="p-2 rounded-full bg-blue-500 text-white"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Mode */}
      {captureMode === 'camera' && (
        <div className="relative w-full h-full">
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <p className="text-white">Camera functionality - simplified version</p>
          </div>
          
          {/* Top close button */}
          <div className="absolute top-4 right-4 z-[10001]">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Mode */}
      {captureMode === 'voice' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">Close</span>
            </button>
            
            <span className="text-gray-900 dark:text-white text-lg font-medium">Voice Note</span>
            
            <div className="w-16"></div>
          </div>

          {/* Voice recording interface */}
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Voice Recording
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Voice functionality - simplified version
              </p>
            </div>

            <button
              className="w-24 h-24 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 transition-all"
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}