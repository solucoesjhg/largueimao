import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export function useKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let maxHeight = window.innerHeight;

    // Fast native events for instant response (No delay!)
    if (Capacitor.isNativePlatform()) {
      const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
        setIsOpen(true);
        setKeyboardHeight(info.keyboardHeight);
      });
      const hideListener = Keyboard.addListener('keyboardWillHide', () => {
        setIsOpen(false);
        setKeyboardHeight(0);
      });
      return () => {
        showListener.then(l => l.remove());
        hideListener.then(l => l.remove());
      };
    }

    // Fallback for Web/Browser
    const handleResize = () => {
      if (window.innerHeight > maxHeight) maxHeight = window.innerHeight;
      if (window.innerHeight < maxHeight - 150) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        setTimeout(() => setIsOpen(true), 100);
        setTimeout(() => window.scrollTo(0, 0), 50);
        setTimeout(() => window.scrollTo(0, 0), 150);
      }
    };
    
    const handleFocusOut = () => {
      setTimeout(() => {
        if (window.innerHeight >= maxHeight - 150) setIsOpen(false);
      }, 100);
      window.scrollTo(0, 0);
    };

    const handleScroll = () => {
      if (window.scrollY > 0 || document.body.scrollTop > 0) window.scrollTo(0, 0);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { isOpen, keyboardHeight };
}
