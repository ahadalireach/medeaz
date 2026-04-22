import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-border-light bg-white px-4 py-2 text-[15px] text-text-primary transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:border-red-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : hint ? (
          <span className="text-xs text-text-secondary">{hint}</span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
