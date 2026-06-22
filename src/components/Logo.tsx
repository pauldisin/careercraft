import { FileText } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  iconColor?: string;
}

export default function Logo({ className = "w-8 h-8", iconClassName = "w-5 h-5", iconColor }: LogoProps) {
  return (
    <div className={`bg-indigo-600 rounded-lg flex items-center justify-center ${className}`}>
      <FileText className={`text-white ${iconClassName}`} color={iconColor} />
    </div>
  );
}
