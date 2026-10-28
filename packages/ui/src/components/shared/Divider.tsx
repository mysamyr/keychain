import { cn } from '../../utils/cn.js';

export interface DividerProps {
  text?: string;
  className?: string;
}

export function Divider({ text, className }: DividerProps) {
  return (
    <div className={cn('kc:relative kc:flex kc:items-center', className)}>
      <div className="kc:flex-1 kc:border-t kc:border-gray-200" />
      {text && (
        <span className="kc:px-3 kc:text-xs kc:uppercase kc:text-gray-400">
          {text}
        </span>
      )}
      <div className="kc:flex-1 kc:border-t kc:border-gray-200" />
    </div>
  );
}
