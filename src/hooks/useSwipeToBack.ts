import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/BottomNav';

export function useSwipeToBack() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwiping = false;
    let swipeDirection = 0; // 1 for left-to-right, -1 for right-to-left
    const threshold = 60; // pixels
    const edgeMargin = 40; // pixels from the edge

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const screenWidth = window.innerWidth;
      
      const isLeftEdge = touch.clientX <= edgeMargin;
      const isRightEdge = touch.clientX >= screenWidth - edgeMargin;
      
      const tabIndex = NAV_ITEMS.findIndex(item => item.path === location.pathname);
      
      if (tabIndex !== -1) {
        // Se estamos em uma aba principal, NENHUM ARRASTE é permitido
        startX = 0;
        return;
      }
      
      // Se não é uma aba principal, permitimos apenas o arraste da borda ESQUERDA para VOLTAR (left-to-right)
      if (!isLeftEdge) {
        startX = 0;
        return;
      }
      
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = new Date().getTime();
      isSwiping = true;
      swipeDirection = 1;
      
      // Reset any previous transition so it tracks the finger instantly
      const root = document.getElementById('root');
      if (root) root.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;
      const touch = e.changedTouches[0];
      const distX = touch.clientX - startX;
      const distY = touch.clientY - startY;
      const root = document.getElementById('root');
      if (!root) return;
      
      // If the user scrolls vertically more than horizontally, cancel the swipe
      if (Math.abs(distY) > Math.abs(distX) && Math.abs(distX) < 20) {
        isSwiping = false;
        root.style.transition = 'transform 0.25s ease-out';
        root.style.transform = 'translateX(0)';
        return;
      }
      
      // Only translate in the allowed direction
      if (swipeDirection === 1 && distX > 0) {
        // Dampen the translation slightly
        root.style.transform = `translateX(${distX * 0.9}px)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping || startX === 0) return;
      isSwiping = false;
      
      const touch = e.changedTouches[0];
      const distX = touch.clientX - startX;
      const distY = touch.clientY - startY;
      const elapsedTime = new Date().getTime() - startTime;
      const screenWidth = window.innerWidth;

      const root = document.getElementById('root');
      if (!root) return;
      root.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
      
      const executeNavigation = (path: string | -1) => {
        // Animate off screen
        root.style.transform = `translateX(${swipeDirection === 1 ? screenWidth : -screenWidth}px)`;
        setTimeout(() => {
          navigate(path as any);
          // Instantly reset position after navigation
          root.style.transition = 'none';
          root.style.transform = 'translateX(0)';
        }, 250);
      };

      const cancelNavigation = () => {
        // Bounce back to 0
        root.style.transform = 'translateX(0)';
      };

      // Se foi rápido o suficiente, andou o suficiente, e não andou muito pra cima/baixo
      if (
        elapsedTime <= 600 &&
        Math.abs(distX) >= threshold &&
        Math.abs(distY) <= 80
      ) {
        const tabIndex = NAV_ITEMS.findIndex(item => item.path === location.pathname);
        
        if (tabIndex !== -1) {
          if (swipeDirection === 1 && distX > 0 && tabIndex > 0) {
            executeNavigation(NAV_ITEMS[tabIndex - 1].path);
          } else if (swipeDirection === -1 && distX < 0 && tabIndex < NAV_ITEMS.length - 1) {
            executeNavigation(NAV_ITEMS[tabIndex + 1].path);
          } else {
            cancelNavigation();
          }
        } else {
          // Voltar padrão de uma sub-página
          if (swipeDirection === 1 && distX > 0 && location.pathname !== '/' && location.pathname !== '/login') {
            if ((window as any).__unsavedChanges) {
              if (window.confirm("Tu começou a cadastrar um item.\nTem certeza que quer sair e perder o que já preencheu?")) {
                (window as any).__unsavedChanges = false;
                executeNavigation(-1);
              } else {
                cancelNavigation();
              }
            } else {
              executeNavigation(-1);
            }
          } else {
            cancelNavigation();
          }
        }
      } else {
        cancelNavigation();
      }
      
      startX = 0;
    };

    const handleTouchCancel = () => {
      if (!isSwiping) return;
      isSwiping = false;
      startX = 0;
      document.body.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
      document.body.style.transform = 'translateX(0)';
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      
      // Reset just in case component unmounts or path changes unexpectedly
      document.body.style.transition = 'none';
      document.body.style.transform = 'translateX(0)';
    };
  }, [navigate, location.pathname]);
}
