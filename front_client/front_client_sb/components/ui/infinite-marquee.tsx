"use client";

import React, { useRef, useEffect } from "react";
import { useRafLoop } from "react-use";

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  reverse?: boolean;
}

const MarqueeItem: React.FC<{
  children: React.ReactNode;
  speed: number;
  reverse: boolean;
}> = ({ children, speed, reverse }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const x = useRef(0);

  const setX = () => {
    if (!itemRef.current || !rectRef.current) {
      return;
    }

    const xPercentage = (x.current / rectRef.current.width) * 100;

    if (xPercentage < -100) {
      x.current = 0;
    }

    if (xPercentage > 0) {
      x.current = -rectRef.current.width;
    }

    itemRef.current.style.transform = `translate3d(${xPercentage}%, 0, 0)`;
  };

  useEffect(() => {
    if (itemRef.current) {
      rectRef.current = itemRef.current.getBoundingClientRect();
    }
  }, [children]);

  const loop = () => {
    x.current -= reverse ? -speed : speed;
    setX();
  };

  const [, loopStart] = useRafLoop(loop, false);

  useEffect(() => {
    loopStart();
  }, [loopStart]);

  return (
    <div ref={itemRef} className="inline-block whitespace-nowrap">
      {children}
    </div>
  );
};

export function InfiniteMarquee({
  children,
  speed = 1,
  className = "",
  reverse = false,
}: InfiniteMarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="relative flex">
        <MarqueeItem speed={speed} reverse={reverse}>
          {children}
        </MarqueeItem>
        <MarqueeItem speed={speed} reverse={reverse}>
          {children}
        </MarqueeItem>
      </div>
    </div>
  );
}
