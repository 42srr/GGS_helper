import * as React from 'react';

/**
 * 스크린 리더 전용 텍스트
 * 시각적으로는 숨겨지지만 스크린 리더가 읽을 수 있음
 */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ children, className, ...props }, ref) => (
  <span
    ref={ref}
    className={`absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ${className || ''}`}
    style={{
      clip: 'rect(0, 0, 0, 0)',
      clipPath: 'inset(50%)',
    }}
    {...props}
  >
    {children}
  </span>
));

VisuallyHidden.displayName = 'VisuallyHidden';
