"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypewriterOptions {
  speed?: number; // ms per character
  delay?: number; // initial delay before typing starts
  onComplete?: () => void;
}

export function useTypewriter(
  text: string,
  { speed = 25, delay = 0, onComplete }: UseTypewriterOptions = {}
) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reset = useCallback(() => {
    setDisplayedText("");
    setIsComplete(false);
    setIsTyping(false);
  }, []);

  useEffect(() => {
    if (!text) {
      reset();
      return;
    }

    reset();

    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;

      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          setIsTyping(false);
          onCompleteRef.current?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [text, speed, delay, reset]);

  return { displayedText, isComplete, isTyping, reset };
}
