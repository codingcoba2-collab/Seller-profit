import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // duration in seconds
  as?: 'span' | 'div' | 'h3' | 'h4' | 'p';
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  speed = 10,
  as = 'div',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // Add a 2px buffer to prevent false triggers on subpixel rendering
        const overflow = textRef.current.scrollWidth > containerRef.current.clientWidth + 2;
        setIsOverflowing(overflow);
      }
    };

    checkOverflow();

    // Check after fonts might have loaded or layout reflowed
    const timer = setTimeout(checkOverflow, 150);

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
  }, [text]);

  const Tag = as;

  if (!isOverflowing) {
    return (
      <Tag ref={containerRef as any} className={`overflow-hidden truncate ${className}`}>
        <span ref={textRef}>{text}</span>
      </Tag>
    );
  }

  return (
    <Tag ref={containerRef as any} className={`overflow-hidden relative select-none ${className}`}>
      <div
        className="inline-flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        <span ref={textRef} className="pr-8 inline-block">{text}</span>
        <span className="pr-8 inline-block">{text}</span>
      </div>
    </Tag>
  );
};
