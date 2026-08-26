import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  hideClearButton?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, hideClearButton, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

    const handleClear = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (localRef.current) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
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
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasValue && type !== "password" && !hideClearButton ? "pr-10" : "",
            className,
          )}
          ref={localRef}
          {...props}
        />
        {hasValue && type !== "password" && !hideClearButton && (
          <button
            type="button"
            onPointerDown={handleClear}
            className="absolute right-0 top-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground focus:outline-none bg-transparent"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
