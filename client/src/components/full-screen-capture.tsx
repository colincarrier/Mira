import { useState, useRef, useEffect } from 'react';
import { Camera, Mic, X, Send, ArrowLeft, Settings, Upload, Image, FileText } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';
import { useToast } from '@/hooks/use-toast';

interface FullScreenCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureMode = 'text' | 'camera' | 'voice' | 'upload-image' | 'upload-file';

export default function FullScreenCapture({ isOpen, onClose }: FullScreenCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>('camera');
  const [noteText, setNoteText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  
  // Temporarily removed refs to fix React runtime error
  // const videoRef = useRef<HTMLVideoElement>(null);
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const titleRef = useRef<HTMLInputElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createNote, createVoiceNote } = useNotes();
  const { toast } = useToast();

  // Keyboard height detection
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - viewportHeight;
      setKeyboardHeight(diff > 100 ? diff : 0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  // Camera setup
  useEffect(() => {
    if (captureMode === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [captureMode, isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string)?.split(',')[1];
          if (base64) {
            createNote({
              content: noteText || 'Photo captured',
              mode: 'smart'
            });
            
            setNoteText('');
            onClose();
            toast({
              title: "Photo saved",
              description: "Your photo has been added to your notes.",
            });
          }
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const handleSendNote = () => {
    if (!noteText.trim() && !noteTitle.trim()) return;

    const content = noteTitle.trim() 
      ? `${noteTitle.trim()}\n\n${noteText.trim()}`
      : noteText.trim();

    createNote({
      content,
      mode: 'smart'
    });
    
    setNoteText('');
    setNoteTitle('');
    onClose();
    toast({
      title: "Note saved",
      description: "Your note has been added successfully.",
    });
  };

  const handleVoiceCapture = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Voice recording not supported",
        description: "Your browser doesn't support voice recording.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        createVoiceNote(blob);
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        onClose();
        toast({
          title: "Voice note saved",
          description: "Your voice note has been transcribed and saved.",
        });
      };

      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // If it's an image, create a preview URL
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setUploadedImageUrl(url);
        setCaptureMode('upload-image');
      } else {
        setCaptureMode('upload-file');
      }
      
      // Auto-fill title with filename
      setNoteTitle(file.name);
    }
  };

  const handleUploadNote = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', noteTitle || selectedFile.name);
      formData.append('content', noteText);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      toast({
        title: "File uploaded successfully",
        description: "Your file has been saved as a note with AI analysis.",
      });

      // Reset and close
      setSelectedFile(null);
      setUploadedImageUrl('');
      setNoteText('');
      setNoteTitle('');
      onClose();
      
      // Refresh the notes list by triggering a page reload or using query invalidation
      window.location.reload();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadedImageUrl('');
    setNoteText('');
    setNoteTitle('');
    setCaptureMode('camera');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[40] bg-black">

      {/* Camera Mode */}
      {captureMode === 'camera' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Top close button */}
          <div className="absolute top-4 right-4 z-[10001]">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main capture button - positioned above input bar */}
          <button
            onClick={capturePhoto}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full bg-white/50 border-4 border-white/70 hover:bg-white/60 transition-all shadow-2xl z-[999999]"
          >
          </button>

          {/* Bottom mode switcher */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[10001]">
            <div className="flex gap-2">
              <button
                onClick={() => setCaptureMode('voice')}
                className="p-3 rounded-full bg-white/30 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCaptureMode('text')}
                className="p-3 rounded-full bg-white/30 text-white hover:bg-white/40 transition-colors backdrop-blur-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
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
                {isRecording ? 'Recording...' : 'Tap to record'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isRecording ? 'Tap again to stop' : 'Your voice will be transcribed automatically'}
              </p>
            </div>

            <button
              onClick={handleVoiceCapture}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>

            {/* Mode switcher */}
            <div className="mt-8">
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
                    className="p-2 rounded-full bg-blue-500 text-white"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCaptureMode('text')}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Mode - iOS Notes Style */}
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
                ref={titleRef}
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
                ref={textareaRef}
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

      {/* Upload Image Mode */}
      {captureMode === 'upload-image' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={resetUpload}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <button
              onClick={handleUploadNote}
              disabled={!selectedFile}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0056CC] transition-colors"
            >
              Save
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Image Preview */}
            {uploadedImageUrl && (
              <div className="mb-4">
                <img 
                  src={uploadedImageUrl} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

            {/* Title */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-2"
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
              placeholder="Add a description..."
              className="w-full h-32 resize-none border-none outline-none bg-transparent text-base leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Upload File Mode */}
      {captureMode === 'upload-file' && (
        <div className="relative w-full h-full bg-[#FEFFFE] dark:bg-[#1C1C1E]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#F2F2F7] dark:bg-[#2C2C2E] border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={resetUpload}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            
            <button
              onClick={handleUploadNote}
              disabled={!selectedFile}
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0056CC] transition-colors"
            >
              Save
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* File Info */}
            {selectedFile && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-2xl font-bold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-2"
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
              placeholder="Add a description..."
              className="w-full h-32 resize-none border-none outline-none bg-transparent text-base leading-relaxed text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt,.rtf"
        className="hidden"
      />
    </div>
  );
}