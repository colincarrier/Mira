
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
        className="fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Action Sheet - Native iOS Dimensions */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center animate-slide-up">
        <div className="w-[270px] mb-8">
          {/* Main Actions */}
          <div className="bg-white/95 backdrop-blur-md rounded-[13px] overflow-hidden mb-2">
            <button
              onClick={() => {
                onPhotoLibrary();
                onClose();
              }}
              className="w-full px-4 py-[14px] text-center text-blue-500 font-normal text-[20px] border-b border-gray-200/50 active:bg-gray-100/50 transition-colors flex items-center justify-center gap-3"
            >
              <Image className="w-[22px] h-[22px]" />
              Photo Library
            </button>
            
            <button
              onClick={() => {
                onChooseFile();
                onClose();
              }}
              className="w-full px-4 py-[14px] text-center text-blue-500 font-normal text-[20px] active:bg-gray-100/50 transition-colors flex items-center justify-center gap-3"
            >
              <FileText className="w-[22px] h-[22px]" />
              Choose File
            </button>
          </div>
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
