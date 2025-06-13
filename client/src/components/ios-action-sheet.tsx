
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
      
      {/* Action Sheet - Positioned relative to input bar with gap */}
      <div className="fixed right-6 z-[101]" style={{ bottom: 'calc(3.5rem + 16px + 60px + 8px)' }}>
        <div className="w-[200px]">
          {/* Main Actions */}
          <div className="bg-white border border-gray-300 rounded-[8px] overflow-hidden shadow-lg">
            <button
              onClick={() => {
                onPhotoLibrary();
                onClose();
              }}
              className="w-full px-3 py-2 text-center text-gray-700 font-normal text-[16px] border-b border-gray-200/50 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2"
            >
              <Image className="w-[16px] h-[16px]" />
              Photo Library
            </button>
            
            <button
              onClick={() => {
                onChooseFile();
                onClose();
              }}
              className="w-full px-3 py-2 text-center text-gray-700 font-normal text-[16px] hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2"
            >
              <FileText className="w-[16px] h-[16px]" />
              Choose File
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
