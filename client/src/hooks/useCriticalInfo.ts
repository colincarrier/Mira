import { useState, useEffect } from 'react';

export const useCriticalInfo = (richContext: any) => {
  const [criticalQuestion, setCriticalQuestion] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const filterCriticalQuestions = (microQuestions: string[]) => {
    if (!microQuestions || microQuestions.length === 0) return [];
    
    const criticalPatterns = [
      // Highest priority - what/where
      /what (is|are) (this|that|it|these)/i,
      /where (is|are|can I find|do I get)/i,
      // Secondary - who (when not obvious)
      /who (makes|sells|provides|offers)/i,
    ];
    
    return microQuestions.filter(q => 
      criticalPatterns.some(pattern => pattern.test(q))
    ).slice(0, 1); // Only show 1 critical question
  };

  useEffect(() => {
    if (richContext && richContext.microQuestions) {
      const critical = filterCriticalQuestions(richContext.microQuestions);
      if (critical.length > 0) {
        setCriticalQuestion(critical[0]);
        setIsVisible(true);
      }
    }
  }, [richContext]);

  const dismissDialog = () => {
    setIsVisible(false);
    setCriticalQuestion(null);
  };

  const handleAnswer = (answer: string) => {
    // Here you could send the answer back to the server to update the note
    console.log('Critical info answer:', answer);
    dismissDialog();
  };

  return {
    criticalQuestion,
    isVisible,
    dismissDialog,
    handleAnswer
  };
};