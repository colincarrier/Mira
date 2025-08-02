import { Camera, Mic, Plus, Send, Square, X as CloseIcon, FileText, Image } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface InputBarProps {
  onTextSubmit?: (text: string) => void;
  onCameraCapture?: () => void;
  onNewNote?: () => void;
  isHidden?: boolean;
  className?: string;
  noteId?: number; // Add noteId prop for existing note updates
}

export default function InputBar({
  onTextSubmit,
  onCameraCapture,
  onNewNote,
  isHidden = false,
  className = "",
  noteId
}: InputBarProps) {
  // Get current page context
  const [location] = useLocation();
  const currentPage = location.split('/')[1] || 'notes';

  // Input state
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Mode state
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Context-aware placeholders and settings
  const getContextConfig = () => {
    switch (currentPage) {
      case 'remind':
        return {
          placeholder: "Add/edit to-do's + reminders...",
          showCamera: false,
          showMediaPicker: false,
          context: "remind"
        };
      case 'collections':
        return {
          placeholder: "Add to collection...",
          showCamera: true,
          showMediaPicker: true,
          context: "collections"
        };
      case 'note-detail':
        return {
          placeholder: "Add/edit anything here...",
          showCamera: true,
          showMediaPicker: true,
          context: "note_edit"
        };
      default: // notes page
        return {
          placeholder: "What's on your mind?",
          showCamera: true,
          showMediaPicker: true,
          context: "notes"
        };
    }
  };

  const config = getContextConfig();

  // Text note mutation
  const createTextNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      console.log('📡 createTextNoteMutation called with:', { text, currentPage, endpoint: currentPage === 'remind' ? "/api/reminders" : "/api/notes" });
      const endpoint = currentPage === 'remind' ? "/api/reminders" : "/api/notes";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text",
          context: config.context
        }),
        credentials: "include",
      });

      console.log('📡 API Response status:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`Failed to create ${currentPage === 'remind' ? 'reminder' : 'note'}`);
      }

      const result = await response.json();
      console.log('📡 API Response data:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: `${currentPage === 'remind' ? 'Reminder' : 'Note'} saved`,
        description: `Your ${currentPage === 'remind' ? 'reminder' : 'note'} has been created successfully.`,
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Text submission error:", error);
      toast({
        title: "Error",
        description: `Failed to save ${currentPage === 'remind' ? 'reminder' : 'note'}. Please try again.`,
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
          type: "voice",
          context: config.context
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
          type: "image",
          context: config.context
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
          type: "file",
          context: config.context
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
    console.log('📷 CAMERA TRIGGERED!');
    closeAllModes();
    onCameraCapture?.();
  }, [onCameraCapture]);

  const toggleSubmenu = useCallback(() => {
    console.log('Submenu button clicked');
    if (isVoiceRecording) {
      stopRecording();
      setIsVoiceRecording(false);
    }
    setShowSubmenu(!showSubmenu);
  }, [isVoiceRecording, showSubmenu]);

  const closeSubmenu = useCallback(() => {
    setShowSubmenu(false);
  }, []);

  // Text input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log('📝 Input changed:', { value, length: value.length });
    setInputText(value);
    setIsTyping(value.length > 0);
  };

  const handleSendMessage = () => {
    console.log('🔍 handleSendMessage triggered with:', { inputText: inputText.trim(), noteId, hasOnTextSubmit: !!onTextSubmit });
    
    if (inputText.trim()) {
      if (noteId) {
        console.log('📝 Updating existing note:', noteId);
        // Automatic clarification vs evolution detection
        const clarification = /^actually[,:\s]|^sorry[,:\s]|^i meant|^correction[,:\s]|^no[,:\s]/i.test(inputText);
        const endpoint = clarification ? 'clarify' : 'evolve';
        
        // Get current note data first
        fetch(`/api/notes/${noteId}`, {
          credentials: "include"
        }).then(response => response.json())
        .then(currentNote => {
          return fetch(`/api/notes/${noteId}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              instruction: inputText.trim(),
              existingContent: currentNote.content,
              existingContext: currentNote.aiContext,
              existingTodos: currentNote.todos || [],
              existingRichContext: currentNote.richContext
            }),
            credentials: "include",
          });
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
          }
          return response.json();
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: [`/api/notes/${noteId}`] });
          setInputText("");
          setIsTyping(false);
          closeAllModes();
          toast({
            title: "Note updated",
            description: "Your clarification has been processed.",
            duration: 3000,
          });
        }).catch(error => {
          console.error('❌ Note update failed:', error);
          toast({
            title: "Update failed", 
            description: "Could not process your clarification. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        });
      } else if (onTextSubmit) {
        console.log('📤 Using onTextSubmit callback');
        onTextSubmit(inputText.trim());
        setInputText("");
        setIsTyping(false);
        closeAllModes();
      } else {
        console.log('🆕 Creating new note via mutation');
        console.log('🚀 About to call createTextNoteMutation.mutate with:', inputText.trim());
        createTextNoteMutation.mutate(inputText.trim());
        console.log('✅ createTextNoteMutation.mutate called');
        setInputText("");
        setIsTyping(false);
        closeAllModes();
      }
    } else {
      console.log('🔘 Empty input, triggering onNewNote');
      onNewNote?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        handleSendMessage();
      }
    }
  };

  const startVoiceRecording = useCallback(async () => {
    setShowSubmenu(false);
    setIsVoiceRecording(true);
    await startRecording();
  }, []);

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
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        createVoiceNoteMutation.mutate(blob);

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

  // Enhanced waveform animation with immediate feedback
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !isVoiceRecording) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const waveform: number[] = [];
    const bufferLength = dataArrayRef.current.length;
    const samplesPerBar = Math.floor(bufferLength / 24); // More bars for smoother visualization

    for (let i = 0; i < bufferLength; i += samplesPerBar) {
      let sum = 0;
      let count = 0;
      for (let j = 0; j < samplesPerBar && i + j < bufferLength; j++) {
        sum += dataArrayRef.current[i + j];
        count++;
      }
      const avgAmplitude = count > 0 ? (sum / count) / 255 : 0;
      // Enhanced scaling for better visual representation
      const scaledAmplitude = Math.pow(avgAmplitude, 0.6) * 1.5;
      waveform.push(Math.min(1, scaledAmplitude));
    }

    // Apply smoothing to reduce visual jitter
    const smoothedWaveform = waveform.map((value, index) => {
      if (index === 0 || index === waveform.length - 1) return value;
      return (waveform[index - 1] + value + waveform[index + 1]) / 3;
    });

    setWaveformData(smoothedWaveform);

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

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(elapsed);
      }, 100);

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

  // File handlers
  const [capturedImageData, setCapturedImageData] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showMediaDialog, setShowMediaDialog] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
          handleFileSelect(file);
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
        handleFileSelect(file);
    }
    if (generalFileInputRef.current) {
      generalFileInputRef.current.value = '';
    }
  };

    const handleFileSelect = async (file: File) => {
    if (!file) return;

    console.log('📁 File selected:', file.name, file.type);

    // Show MediaContextDialog for all file uploads (same as camera flow)
    setSelectedFile(file);
    setShowMediaDialog(true);
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
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={generalFileInputRef}
        type="file"
        onChange={handleGeneralFileSelect}
        className="hidden"
      />

      {/* Main input bar */}
      <div 
        className={`fixed left-4 right-4 ${className}`}
        style={{ 
          zIndex: 9999,
          bottom: 'calc(3.5rem + 16px)',
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}
      >
        <div className="relative flex items-center gap-1.5 bg-white rounded-2xl p-3 shadow-lg border border-gray-300">
          {/* Media picker overlay - positioned above plus button */}
          {showSubmenu && config.showMediaPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50" style={{ right: '48px' }}>
              <div className="w-[200px] bg-white border border-gray-300 rounded-[8px] overflow-hidden shadow-lg">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSubmenu();
                    // Direct trigger without setTimeout to prevent native behavior
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full px-3 py-2 text-center text-gray-700 font-normal text-[16px] border-b border-gray-200/50 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2"
                  disabled={uploadImageMutation.isPending}
                >
                  <Image className="w-[16px] h-[16px]" />
                  {uploadImageMutation.isPending ? "Uploading..." : "Photo Library"}
                </button>

                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeSubmenu();
                    // Direct trigger without setTimeout to prevent native behavior
                    if (generalFileInputRef.current) {
                      generalFileInputRef.current.click();
                    }
                  }}
                  className="w-full px-3 py-2 text-center text-gray-700 font-normal text-[16px] hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2"
                  disabled={uploadFileMutation.isPending}
                >
                  <FileText className="w-[16px] h-[16px]" />
                  {uploadFileMutation.isPending ? "Uploading..." : "Choose File"}
                </button>
              </div>
            </div>
          )}

          {/* Enhanced streaming waveform display */}
          {isVoiceRecording && (
            <div className="absolute left-3 right-20 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg px-3 py-2 z-20 shadow-lg">
              <div className="text-xs font-mono text-red-600 dark:text-red-400 min-w-[2.5rem]">
                {formatTime(recordingTime)}
              </div>
              <div className="flex-1 h-6 flex items-end justify-start space-x-0.5 overflow-hidden">
                {waveformData.length > 0 ? (
                  waveformData.slice(0, 24).map((amplitude, index) => (
                    <div
                      key={`${Date.now()}-${index}`}
                      className="w-0.5 bg-gradient-to-t from-red-600 via-red-500 to-orange-400 dark:from-red-500 dark:via-red-400 dark:to-orange-300 rounded-full transition-all duration-50 ease-out"
                      style={{
                        height: `${Math.max(2, amplitude * 22)}px`,
                        opacity: Math.max(0.5, 0.7 + amplitude * 0.3),
                        transform: `scaleY(${Math.max(0.2, amplitude + 0.1)})`,
                        animation: amplitude > 0.1 ? 'pulse 0.3s ease-in-out' : 'none'
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center space-x-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 h-2 bg-gradient-to-t from-red-600 to-orange-400 rounded-full animate-pulse"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1s'
                        }}
                      />
                    ))}
                    <span className="text-xs text-red-600 dark:text-red-400 ml-2">Recording...</span>
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
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            data-note-id={noteId}
            placeholder={isVoiceRecording ? "Recording voice note..." : config.placeholder}
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
            {config.showMediaPicker && (
              <button 
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubmenu();
                }}
                className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {inputText.trim() ? (
              <button 
                onClick={(e) => {
                  console.log('🎯 Send button clicked!', e);
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }}
                onMouseDown={(e) => {
                  console.log('🎯 Send button mouse down!', e);
                }}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <>
                {config.showCamera && (
                  <button 
                    onClick={openCamera}
                    className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#a8bfa1' }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
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
      
      {/* Media Context Dialog - temporarily disabled */}
      {showMediaDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <button 
              onClick={() => {
                setShowMediaDialog(false);
                setCapturedImageData("");
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}