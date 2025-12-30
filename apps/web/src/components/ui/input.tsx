import * as React from "react";

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "form" | "filter";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, variant = "form", ...props }, ref) => {
  const variants = {
    form: "w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-white placeholder-gray-400",
    filter: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none",
  };

  return (
    <input
      type={type}
      className={`${variants[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
