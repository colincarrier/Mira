import { X } from 'lucide-react';

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[40] bg-black">
      <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-medium">Close</span>
          </button>
          <span className="text-gray-900 dark:text-white text-lg font-medium">Add Note</span>
          <div className="w-16"></div>
        </div>
        
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-400">Note creation interface - simplified version</p>
        </div>
      </div>
    </div>
  );
}