import React, { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { Link } from "react-router-dom";

const buttonVariants = cva(
  "inline-flex items-center justify-center text-md font-medium transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "text-white bg-gradient-to-b from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] hover:opacity-70 dark:text-white dark:bg-gradient-to-b dark:from-[#18C8FF] dark:via-[#4B8CFF] dark:to-[#6D6DFF] dark:hover:opacity-70",
        destructive:
          "bg-red-500 text-white hover:bg-red-600/90 dark:bg-red-600 dark:text-white dark:hover:bg-red-700/90",
        outlineWhite:
          "border border-primary px-4 py-2 dark:border-white dark:text-white dark:bg-transparent dark:hover:bg-white dark:hover:text-primary bg-transparent hover:bg-primary hover:text-white ",
        primaryWhite:
          "text-primary bg-primary text-white hover:border-primary hover:text-primary hover:bg-transparent dark:text-primary dark:bg-white dark:hover:text-white  dark:hover:bg-transparent border border-white dark:border-white",
        cancel:
          "bg-[#BCBCBC] text-white hover:bg-[#BCBCBC]/70 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600/70",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-800 dark:hover:text-white",
        link:
          "underline underline-offset-4 text-primary dark:text-white dark:hover:text-white/70",
        join:
          "bg-purple-600 text-white hover:bg-purple-700/90 dark:bg-purple-800 dark:text-white dark:hover:bg-purple-900/90",
        noStyle:
          "text-black dark:text-white",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "py-3 px-6",
        lg: "py-5 px-8",
        icon: "h-10 w-10",
        join: "h-12 px-5",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        '2xl': "rounded-2xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "md",
    },
  }
);

const Button = forwardRef(
  ({ className, variant, size, icon, children, to, type = "button", rounded = "md", ...props }, ref) => {
    const classes = buttonVariants({ variant, size, rounded, className });

    if (to) {
      return (
        <Link to={to} className={classes} ref={ref} {...props}>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </Link>
      );
    }

    return (
      <button type={type} className={classes} ref={ref} {...props}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
