import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // duration in seconds
  as?: 'span' | 'div' | 'h3' | 'h4' | 'p';
  alwaysAnimate?: boolean;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  speed = 12,
  as = 'div',
  alwaysAnimate = false,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const measurerRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(alwaysAnimate);

  useEffect(() => {
    if (alwaysAnimate) {
      setIsOverflowing(true);
      return;
    }

    const checkOverflow = () => {
      if (containerRef.current && measurerRef.current) {
        // Measure unconstrained text width against container client width
        const textWidth = measurerRef.current.getBoundingClientRect().width;
        const containerWidth = containerRef.current.clientWidth;
        const overflow = textWidth > containerWidth + 2;
        setIsOverflowing(overflow);
      }
    };

    checkOverflow();

    // Re-check after layout & font paint
    const timer = setTimeout(checkOverflow, 120);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', checkOverflow);
    }

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', checkOverflow);
      }
    };
  }, [text, alwaysAnimate]);

  const Tag = as as any;

  return (
    <Tag
      ref={containerRef}
      className={`overflow-hidden relative select-none ${className}`}
      title={text}
    >
      {/* Invisible off-screen unconstrained span to accurately measure text width across all browsers (including iOS Safari) */}
      {!alwaysAnimate && (
        <span
          ref={measurerRef}
          aria-hidden="true"
          className="absolute -top-9999px left-0 invisible whitespace-nowrap pointer-events-none"
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden', whiteSpace: 'nowrap' }}
        >
          {text}
        </span>
      )}

      {isOverflowing ? (
        <span
          className="inline-flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]"
          style={{ animationDuration: `${speed}s` }}
        >
          <span className="pr-8 inline-block">{text}</span>
          <span className="pr-8 inline-block">{text}</span>
        </span>
      ) : (
        <span className="block truncate">{text}</span>
      )}
    </Tag>
  );
};
