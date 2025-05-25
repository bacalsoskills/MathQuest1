import React from "react";
import { cva } from "class-variance-authority";

const headerVariants = cva("", {
  variants: {
    variant: {
      default: "text-black",
      primary: "text-primary",
      secondary: "text-secondary",
      accent: "text-accent",
    },
    fontSize: {
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
    },
  },
  defaultVariants: {
    variant: "default",
    fontSize: "base",
    weight: "normal",
  },
});

const Header = ({
  type = "h2",
  variant,
  fontSize,
  weight,
  className = "",
  children,
  ...props
}) => {
  const Tag = type;
  const combinedClassName = `${headerVariants({ variant, fontSize, weight })} ${className}`.trim();
  
  return (
    <Tag className={combinedClassName} {...props}>
      {children}
    </Tag>
  );
};

export { Header, headerVariants };
