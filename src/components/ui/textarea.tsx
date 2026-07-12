import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const localRef = React.useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(ref, () => localRef.current as HTMLTextAreaElement);

    const handleClear = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (localRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value"
          )?.set;
          nativeInputValueSetter?.call(localRef.current, "");
          const event = new Event("input", { bubbles: true });
          localRef.current.dispatchEvent(event);
        }
      },
      []
    );

    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    return (
      <div className="relative w-full">
        <textarea
          value={value}
          onChange={onChange}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasValue ? "pr-10" : "",
            className,
          )}
          ref={localRef}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onPointerDown={handleClear}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none bg-background rounded-full"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
