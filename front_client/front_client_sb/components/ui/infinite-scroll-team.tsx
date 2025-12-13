"use client";

import React, { useRef, useEffect } from "react";
import { useRafLoop } from "react-use";

interface InfiniteScrollTeamProps {
  children: React.ReactNode;
  speed?: number;
  reverse?: boolean;
}

const ScrollItem: React.FC<{
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
    <div ref={itemRef} className="inline-flex gap-6 pr-6">
      {children}
    </div>
  );
};

export function InfiniteScrollTeam({
  children,
  speed = 0.5,
  reverse = false,
}: InfiniteScrollTeamProps) {
  return (
    <div className="overflow-hidden w-full">
      <div className="relative flex">
        <ScrollItem speed={speed} reverse={reverse}>
          {children}
        </ScrollItem>
        <ScrollItem speed={speed} reverse={reverse}>
          {children}
        </ScrollItem>
      </div>
    </div>
  );
}
