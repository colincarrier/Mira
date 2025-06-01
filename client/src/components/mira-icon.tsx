interface MiraIconProps {
  className?: string;
}

export default function MiraIcon({ className = "w-4 h-4" }: MiraIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Circle representing memory/mind */}
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
      
      {/* Central dot representing focus/awareness */}
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      
      {/* Three arcs representing layers of memory/thought */}
      <path d="M8 8 Q12 6 16 8" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M8 12 Q12 10 16 12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
      <path d="M8 16 Q12 14 16 16" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    </svg>
  );
}