import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface AdUnitProps {
  className?: string;
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdUnit({ className, slot, format = 'auto', responsive = true }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('Error loading ad:', err);
    }
  }, []);

  const adStyle = responsive
    ? { display: 'block' }
    : { display: 'inline-block', width: '100%' };

  return (
    <div className={cn('overflow-hidden', className)}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}