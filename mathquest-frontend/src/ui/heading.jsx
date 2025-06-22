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
      sm: "text-xs md:text-sm ",
      base: "text-sm md:text-base",
      lg: "text-base md:text-lg",
      xl: "text-lg md:text-xl",
      "2xl": "text-xl md:text-2xl",
      "3xl": "text-2xl md:text-3xl",
      "4xl": "text-3xl md:text-4xl",
      "5xl": "text-4xl md:text-5xl",
      "6xl": "text-5xl md:text-6xl",
      "7xl": "text-6xl md:text-7xl",
    },
    weight: {
      thin: "font-thin",
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
