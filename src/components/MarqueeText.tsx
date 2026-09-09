import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Force marquee always active, or only when overflowing (default: 'auto') */
  mode?: 'auto' | 'always' | 'hover';
  /** Animation speed in pixels per second (default: 35) */
  speed?: number;
  /** Add subtle fade out masks at left and right edges (default: true) */
  fadeEdges?: boolean;
}

/**
 * Komponen Tulisan Berjalan (Marquee Text)
 * Otomatis mendeteksi jika tulisan terpotong / overflow, dan menjalankan teks
 * secara mulus sehingga seluruh kalimat selalu terbaca utuh tanpa terpotong.
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  children,
  className = '',
  containerClassName = '',
  mode = 'auto',
  speed = 35,
  fadeEdges = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [duration, setDuration] = useState(12);

  const content = text ?? children;

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;

      if (textWidth > containerWidth + 2) {
        setIsOverflowing(true);
        // Hitung durasi agar kecepatan membaca konstan (speed px/detik)
        const travelDistance = textWidth + containerWidth * 0.4;
        const calculatedDuration = Math.max(6, Math.round(travelDistance / speed));
        setDuration(calculatedDuration);
      } else {
        setIsOverflowing(false);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [content, speed]);

  const shouldAnimate = mode === 'always' || (mode === 'auto' && isOverflowing);
  const hoverAnimate = mode === 'hover' && isOverflowing;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full max-w-full ${containerClassName}`}
      style={{
        maskImage: fadeEdges && isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 10px), transparent 100%)'
          : undefined,
        WebkitMaskImage: fadeEdges && isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 10px), transparent 100%)'
          : undefined,
      }}
      title={typeof content === 'string' ? content : undefined}
    >
      <div
        className={`whitespace-nowrap inline-flex items-center ${
          shouldAnimate ? 'animate-marquee-smooth' : hoverAnimate ? 'group-hover:animate-marquee-smooth' : ''
        }`}
        style={
          shouldAnimate || hoverAnimate
            ? {
                animationDuration: `${duration}s`,
              }
            : undefined
        }
      >
        <span ref={textRef} className={`inline-block ${className}`}>
          {content}
        </span>

        {/* Duplicate text spacer for continuous smooth looping marquee */}
        {(shouldAnimate || hoverAnimate) && (
          <span className={`inline-block pl-8 ${className}`} aria-hidden="true">
            {content}
          </span>
        )}
      </div>
    </div>
  );
};
