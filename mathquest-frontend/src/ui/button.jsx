import React, { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { Link } from "react-router-dom";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/70",
        destructive: "bg-red-500 text-destructive-foreground hover:bg-red-600/90",
        outline: "border border-white hover:bg-white text-white hover:text-primary hover:text-accent-foreground",
        secondary: "bg-secondary text-white hover:bg-secondary/70",
        cancel: "bg-[#BCBCBC] text-white hover:bg-[#BCBCBC]/70",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        join: "bg-purple-600 text-white hover:bg-purple-700/90",
        noStyle: "text-black",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "py-3 px-8 rounded-none",
        lg: "py-5 px-8 rounded-none",
        icon: "h-10 w-10",
        join: "h-12 px-5 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(
  ({ className, variant, size, icon, children, to, type = "button", ...props }, ref) => {
    const classes = buttonVariants({ variant, size, className });

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
