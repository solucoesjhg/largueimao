import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DelayedSpinner({ isLoading }: { isLoading: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => setShow(true), 1000);
    } else {
      setShow(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!isLoading || !show) return null;

  return (
    <div className="flex justify-center p-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
