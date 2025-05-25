import * as React from "react";
import { cn } from "../lib/utils";

const textareaVariants = {
  default:
    "flex min-h-[80px] w-full rounded-none bg-transparent border-dark border px-3 py-2 text-sm focus:outline-none focus:border-primary",
  error:
    "flex min-h-[80px] w-full rounded-none bg-transparent border-red-500 border px-3 py-2 text-sm focus:outline-none focus:border-red-500",
  gray: "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
};

const Textarea = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <textarea
      className={cn(textareaVariants[variant], className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
