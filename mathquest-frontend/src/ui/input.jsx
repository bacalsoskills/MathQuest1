import * as React from "react";
import { cn } from "../lib/utils";

const inputVariants = {
  default:
    "flex h-10 w-full rounded-none bg-transparent border-dark border px-3 py-2 text-sm focus:outline-none focus:border-primary",
  error:
    "flex h-10 w-full rounded-none bg-transparent border-red-500 border px-3 py-2 text-sm focus:outline-none focus:border-red-500",
  success:
    "flex h-10 w-full rounded-none bg-transparent border-green-500 border px-3 py-2 text-sm focus:outline-none focus:border-green-500",
  disabled:
    "flex h-10 w-full rounded-none bg-gray-100 text-gray-400 border border-gray-300 px-3 py-2 text-sm cursor-not-allowed",
  gray: "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
};

const Input = React.forwardRef(({ className, type, variant = "default", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(inputVariants[variant], className)}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
