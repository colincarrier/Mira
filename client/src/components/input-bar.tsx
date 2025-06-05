import { Camera, Mic, Plus, Send, Square, Image, FileText, X } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface InputBarProps {
  onCameraCapture?: () => void;
  onNewNote?: () => void;
  onTextSubmit?: (text: string) => void;
  isHidden?: boolean;
}

export default function InputBar({
  onCameraCapture,
  onNewNote,
  onTextSubmit,
  isHidden = false
}: InputBarProps) {
  // Input state
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Mode state (mutually exclusive)
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  // Voice recording state
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Touch interaction for hiding input bar
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Text note mutation
  const createTextNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text"
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create text note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Note saved",
        description: "Your note has been created successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Text note error:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Voice note mutation
  const createVoiceNoteMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const placeholderResponse = await fetch("/api/notes/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: "🎤 Recording voice note...",
          type: "voice"
        }),
        credentials: "include",
      });
      
      if (!placeholderResponse.ok) {
        throw new Error("Failed to create placeholder note");
      }
      
      const placeholderNote = await placeholderResponse.json();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("noteId", placeholderNote.id.toString());
      
      const response = await fetch("/api/notes/voice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload voice note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Voice note saved",
        description: "Your voice note has been transcribed and saved.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Voice note error:", error);
      toast({
        title: "Error",
        description: "Failed to save voice note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const placeholderResponse = await fetch("/api/notes/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: "📷 Processing image...",
          type: "image"
        }),
        credentials: "include",
      });
      
      if (!placeholderResponse.ok) {
        throw new Error("Failed to create placeholder note");
      }
      
      const placeholderNote = await placeholderResponse.json();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      
      const formData = new FormData();
      formData.append("image", file);
      formData.append("noteId", placeholderNote.id.toString());
      
      const response = await fetch("/api/notes/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      closeSubmenu();
      toast({
        title: "Image processed",
        description: "Your image has been analyzed and enhanced by AI.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const placeholderResponse = await fetch("/api/notes/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: `📄 Processing ${file.name}...`,
          type: "file"
        }),
        credentials: "include",
      });
      
      if (!placeholderResponse.ok) {
        throw new Error("Failed to create placeholder note");
      }
      
      const placeholderNote = await placeholderResponse.json();
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("noteId", placeholderNote.id.toString());
      
      const response = await fetch("/api/notes/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      closeSubmenu();
      toast({
        title: "File processed",
        description: "Your file has been analyzed and enhanced by AI.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("File upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mode management functions
  const closeAllModes = useCallback(() => {
    setShowSubmenu(false);
    if (isVoiceRecording) {
      stopRecording();
      setIsVoiceRecording(false);
    }
  }, [isVoiceRecording]);

  const openCamera = useCallback(() => {
    console.log('📷 CAMERA TRIGGERED! Current states:', { showSubmenu, isVoiceRecording });
    // Close all other modes first
    setShowSubmenu(false);
    if (isVoiceRecording) {
      stopRecording();
      setIsVoiceRecording(false);
    }
    onCameraCapture?.();
  }, [isVoiceRecording, showSubmenu, onCameraCapture]);

  const toggleSubmenu = useCallback(() => {
    console.log('Submenu button clicked, current states:', { showSubmenu, isVoiceRecording });
    // Close voice recording if active
    if (isVoiceRecording) {
      stopRecording();
      setIsVoiceRecording(false);
    }
    // Toggle submenu
    setShowSubmenu(!showSubmenu);
  }, [isVoiceRecording, showSubmenu]);

  const closeSubmenu = useCallback(() => {
    setShowSubmenu(false);
  }, []);

  // Text input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    setIsTyping(value.length > 0);
  };

  const handleSendMessage = () => {
    console.log('🚀 SEND BUTTON CLICKED! Text:', inputText, 'onTextSubmit exists:', !!onTextSubmit);
    if (inputText.trim()) {
      console.log('✅ Text found, processing:', inputText.trim());
      if (onTextSubmit) {
        console.log('🎯 Using onTextSubmit prop');
        onTextSubmit(inputText.trim());
      } else {
        console.log('📝 Using internal mutation');
        createTextNoteMutation.mutate(inputText.trim());
      }
      setInputText("");
      setIsTyping(false);
      closeAllModes(); // Close any open modes
    } else {
      console.log('❌ No text to send, calling onNewNote fallback');
      onNewNote?.(); // Fallback for empty text
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('🔑 ENTER pressed with text:', inputText);
      if (onTextSubmit && inputText.trim()) {
        console.log('🔑 Calling onTextSubmit via Enter');
        onTextSubmit(inputText.trim());
        setInputText("");
        setIsTyping(false);
      } else {
        console.log('🔑 Enter pressed but no onTextSubmit or empty text');
      }
    }
  };

  const startVoiceRecording = useCallback(async () => {
    console.log('Voice button clicked, current states:', { showSubmenu, isVoiceRecording });
    // Close submenu if open
    setShowSubmenu(false);
    setIsVoiceRecording(true);
    await startRecording();
  }, [showSubmenu, isVoiceRecording]);

  const stopVoiceRecording = useCallback(() => {
    stopRecording();
    setIsVoiceRecording(false);
  }, []);

  // Audio setup and recording functions
  const setupAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Try to use a supported audio format
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/ogg' });
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const recordingDuration = Date.now() - recordingStartTime;
        console.log('Recording stopped, duration:', recordingDuration, 'ms');
        
        // Only process recordings longer than 1 second
        if (recordingDuration >= 1000) {
          console.log('Processing recording - duration acceptable');
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          createVoiceNoteMutation.mutate(blob);
        } else {
          console.log('Recording too short, discarding - no note will be created');
          // Silently discard short recordings without creating any note
        }
        
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setWaveformData([]);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      return true;
    } catch (error) {
      console.error('Audio setup error:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
      return false;
    }
  }, [createVoiceNoteMutation, toast]);

  // Waveform animation
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isVoiceRecording) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const waveform: number[] = [];
    const bufferLength = dataArrayRef.current.length;
    const step = Math.floor(bufferLength / 16);
    
    for (let i = 0; i < bufferLength; i += step) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < step && i + j < bufferLength; j++) {
        sum += dataArrayRef.current[i + j];
        count++;
      }
      const avgAmplitude = count > 0 ? (sum / count) / 255 : 0;
      waveform.push(Math.min(1, avgAmplitude * 3)); // Amplify for better visibility
    }
    
    setWaveformData(waveform);
    
    if (isVoiceRecording) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [isVoiceRecording]);

  const startWaveformAnimation = useCallback(() => {
    updateWaveform();
  }, [updateWaveform]);

  const stopWaveformAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  // Recording functions
  const startRecording = useCallback(async () => {
    const success = await setupAudioContext();
    if (!success) return;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      mediaRecorderRef.current.start(100);
      setRecordingTime(0);
      
      // Use actual elapsed time instead of simple counter
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);
      }, 100); // Check every 100ms for smoother updates
      
      startWaveformAnimation();
    }
  }, [setupAudioContext, startWaveformAnimation]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      stopWaveformAnimation();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setRecordingTime(0);
    setWaveformData([]);
  }, [stopWaveformAnimation]);

  // Removed duplicate text input functions - using the correct ones above

  // File handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        uploadImageMutation.mutate(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please select an image file (JPG, PNG, GIF, etc.)",
          variant: "destructive",
        });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGeneralFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
    if (generalFileInputRef.current) {
      generalFileInputRef.current.value = '';
    }
  };

  const openPhotoLibrary = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    closeSubmenu();
  };

  const openFilePicker = () => {
    if (generalFileInputRef.current) {
      generalFileInputRef.current.click();
    }
    closeSubmenu();
  };

  // Touch gesture handlers for hiding input bar
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
    
    if (deltaX > 50 && deltaY < 30) {
      setIsAddButtonHidden(true);
    } else if (deltaX < -50 && deltaY < 30) {
      setIsAddButtonHidden(false);
    }
    
    setTouchStart(null);
  };

  // Format time for recording timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isHidden) return null;

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        id="image-file-input"
        name="imageFile"
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        aria-label="Select image file"
      />
      <input
        ref={generalFileInputRef}
        id="general-file-input"
        name="generalFile"
        type="file"
        onChange={handleGeneralFileSelect}
        className="hidden"
        aria-label="Select any file"
      />

      {/* Main input bar */}
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
        <div className="relative flex items-center gap-1.5 bg-white rounded-2xl p-3 shadow-lg border border-gray-300">
          {/* Media picker overlay */}
          {showSubmenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Add Media</span>
                <button 
                  onClick={closeSubmenu}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openFilePicker}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploadFileMutation.isPending}
                >
                  <FileText className="w-6 h-6 text-purple-500 mb-1" />
                  <span className="text-xs text-gray-600">
                    {uploadFileMutation.isPending ? "Uploading..." : "Files"}
                  </span>
                </button>
                <button
                  onClick={openPhotoLibrary}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploadImageMutation.isPending}
                >
                  <Image className="w-6 h-6 text-blue-500 mb-1" />
                  <span className="text-xs text-gray-600">
                    {uploadImageMutation.isPending ? "Uploading..." : "Media"}
                  </span>
                </button>
              </div>
            </div>
          )}
          
          {/* Recording waveform display */}
          {isVoiceRecording && (
            <div className="absolute left-3 right-20 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 bg-white/95 rounded-lg px-3 py-2 z-20">
              <div className="text-xs font-mono text-red-600 min-w-[2.5rem]">
                {formatTime(recordingTime)}
              </div>
              <div className="flex-1 h-6 flex items-end justify-start space-x-0.5 overflow-hidden">
                {waveformData.length > 0 ? (
                  waveformData.slice(0, 20).map((amplitude, index) => (
                    <div
                      key={index}
                      className="w-0.5 bg-gradient-to-t from-red-600 to-red-400 rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(2, amplitude * 20)}px`,
                        opacity: 0.7 + amplitude * 0.3
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-xs text-red-600 ml-2">Recording...</span>
                  </div>
                )}
              </div>
              {createVoiceNoteMutation.isPending && (
                <div className="text-xs text-blue-600">Processing...</div>
              )}
            </div>
          )}

          {/* Text input */}
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (onTextSubmit && inputText.trim()) {
                  onTextSubmit(inputText.trim());
                  setInputText("");
                  setIsTyping(false);
                }
              }
            }}
            placeholder={isVoiceRecording ? "Recording voice note..." : "Add/edit anything..."}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900 resize-none overflow-hidden"
            rows={1}
            style={{
              minHeight: '20px',
              maxHeight: '120px'
            }}
            disabled={isVoiceRecording}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={toggleSubmenu}
              className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {inputText.trim() ? (
              <button 
                onClick={() => {
                  if (onTextSubmit && inputText.trim()) {
                    onTextSubmit(inputText.trim());
                    setInputText("");
                    setIsTyping(false);
                  }
                }}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button 
                  onClick={openCamera}
                  className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: '#a8bfa1' }}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button 
                  onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20 relative hover:opacity-90 text-[#374252]"
                  style={{ backgroundColor: isVoiceRecording ? '#ef4444' : '#9bb8d3' }}
                  disabled={createVoiceNoteMutation.isPending}
                >
                  {isVoiceRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
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