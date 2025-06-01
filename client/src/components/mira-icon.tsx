interface MiraIconProps {
  className?: string;
}

export default function MiraIcon({ className = "w-4 h-4" }: MiraIconProps) {
  return (
    <span 
      className={`${className} inline-flex items-center justify-center font-bold italic text-current`}
      style={{ 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontWeight: '800',
        fontStyle: 'italic'
      }}
    >
      M
    </span>
  );
}