import { useState, useRef, ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [LPullDistance, setPullDistance] = useState(0);
  const [LIsRefreshing, setIsRefreshing] = useState(false);
  const LStartY = useRef(0);
  const LContainerRef = useRef<HTMLDivElement>(null);
  const LMaxPull = 100;
  const LThreshold = 60;

  const handleTouchStart = (AEvent: React.TouchEvent) => {
    if (LIsRefreshing) return;
    const LScrollTop = LContainerRef.current?.scrollTop || 0;
    if (LScrollTop === 0) {
      LStartY.current = AEvent.touches[0].clientY;
    } else {
      LStartY.current = 0;
    }
  };

  const handleTouchMove = (AEvent: React.TouchEvent) => {
    if (LIsRefreshing || LStartY.current === 0) return;

    const LCurrentY = AEvent.touches[0].clientY;
    const LDelta = LCurrentY - LStartY.current;

    // Apenas se estiver puxando para baixo e no topo
    if (LDelta > 0 && (LContainerRef.current?.scrollTop || 0) <= 0) {
      // Aplica uma resistência (friction)
      const LResisted = Math.min(LDelta * 0.4, LMaxPull);
      setPullDistance(LResisted);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (LIsRefreshing || LStartY.current === 0) return;
    LStartY.current = 0;

    if (LPullDistance >= LThreshold) {
      setIsRefreshing(true);
      setPullDistance(LThreshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      className={cn("relative overflow-hidden h-full flex flex-col w-full", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador de carregamento escondido no topo */}
      <div 
        className="absolute left-0 right-0 flex items-center justify-center z-10 transition-transform duration-300"
        style={{
          height: LThreshold,
          transform: `translateY(${Math.max(LPullDistance - LThreshold, -LThreshold)}px)`,
          opacity: LPullDistance / LThreshold
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-md border border-border text-primary">
          {LIsRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown 
              className="h-5 w-5 transition-transform" 
              style={{ transform: `rotate(${Math.min(LPullDistance * 3, 180)}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Conteúdo rolável */}
      <div 
        ref={LContainerRef}
        className="flex-1 overflow-y-auto w-full h-full transition-transform"
        style={{ 
          transform: `translateY(${LPullDistance}px)`,
          transitionDuration: LIsRefreshing || LPullDistance === 0 ? '300ms' : '0ms'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
