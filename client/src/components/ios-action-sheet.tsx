
import React from 'react';
import { X, Image, FileText } from 'lucide-react';

interface IOSActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoLibrary: () => void;
  onChooseFile: () => void;
}

export default function IOSActionSheet({ 
  isOpen, 
  onClose, 
  onPhotoLibrary, 
  onChooseFile 
}: IOSActionSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Action Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] animate-slide-up">
        {/* Main Actions */}
        <div className="bg-white/95 backdrop-blur-md mx-4 mb-2 rounded-xl overflow-hidden">
          <button
            onClick={() => {
              onPhotoLibrary();
              onClose();
            }}
            className="w-full px-6 py-4 text-left text-blue-500 font-medium text-lg border-b border-gray-200/50 active:bg-gray-100/50 transition-colors flex items-center gap-3"
          >
            <Image className="w-5 h-5" />
            Photo Library
          </button>
          
          <button
            onClick={() => {
              onChooseFile();
              onClose();
            }}
            className="w-full px-6 py-4 text-left text-blue-500 font-medium text-lg active:bg-gray-100/50 transition-colors flex items-center gap-3"
          >
            <FileText className="w-5 h-5" />
            Choose File
          </button>
        </div>
        
        {/* Cancel Button */}
        <div className="bg-white/95 backdrop-blur-md mx-4 mb-8 rounded-xl overflow-hidden">
          <button
            onClick={onClose}
            className="w-full px-6 py-4 text-center text-blue-500 font-semibold text-lg active:bg-gray-100/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
