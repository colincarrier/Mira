import { useState, useEffect, useRef } from "react";

// Add proper TypeScript declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = 
        window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        
        // Optimize settings for speed and accuracy
        recognition.continuous = false; // Better for mobile performance
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.maxAlternatives = 3; // Get multiple alternatives for better accuracy

        recognition.onstart = () => {
          setIsListening(true);
          finalTranscriptRef.current = "";
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = finalTranscriptRef.current;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
              finalTranscript += transcript + " ";
              finalTranscriptRef.current = finalTranscript;
              setConfidence(result[0].confidence || 0.8);
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === 'no-speech') {
            // Auto-restart on no speech for continuous experience
            setTimeout(() => {
              if (isListening) {
                recognition.start();
              }
            }, 100);
          } else {
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isListening]);

  const startListening = () => {
    if (recognitionRef.current && isSupported && !isListening) {
      try {
        setTranscript("");
        finalTranscriptRef.current = "";
        setConfidence(0);
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const restartListening = () => {
    if (recognitionRef.current && isSupported) {
      stopListening();
      setTimeout(() => {
        startListening();
      }, 100);
    }
  };

  return {
    transcript,
    isListening,
    isSupported,
    confidence,
    startListening,
    stopListening,
    restartListening,
  };
}
