import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectNativeProps extends React.ComponentProps<"select"> {
  variant?: "default" | "filter";
}

const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, variant = "default", ...props }, ref) => {
    const variants = {
      default:
        "appearance-none w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 pr-10 text-lg font-semibold focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none cursor-pointer",
      filter:
        "w-full bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-500",
    };

    return (
      <div className="relative">
        <select
          className={`${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);
SelectNative.displayName = "SelectNative";

export { SelectNative };
