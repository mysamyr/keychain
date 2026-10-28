import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  prefix: 'kc',
  extend: {
    theme: {
      color: [
        'accent',
        'accent-hover',
        'accent-light',
        'critical',
        'critical-hover',
        'critical-light',
        'positive',
        'positive-light',
      ],
      radius: ['card', 'input'],
      font: ['body'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
