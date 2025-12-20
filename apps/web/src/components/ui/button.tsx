import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: ButtonSize;
  asChild?: boolean;
}

type AtomicButtonProps = Omit<ButtonProps, "variant">;

function ButtonDefault({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/20 dark:focus-visible:ring-ring/40 ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function ButtonDestructive({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function ButtonOutline({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function ButtonSecondary({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground hover:bg-secondary/80 ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function ButtonGhost({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function ButtonLink({ className, size = "default", asChild = false, ...props }: AtomicButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary underline-offset-4 hover:underline ${size === "sm" ? "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" : size === "lg" ? "h-10 rounded-md px-6 has-[>svg]:px-4" : size === "icon" ? "size-9" : size === "icon-sm" ? "size-8" : size === "icon-lg" ? "size-10" : "h-9 px-4 py-2 has-[>svg]:px-3"} ${className || ""}`}
      {...props}
    />
  );
}

function Button({ variant = "default", ...props }: ButtonProps) {
  switch (variant) {
    case "destructive":
      return <ButtonDestructive {...props} />;
    case "outline":
      return <ButtonOutline {...props} />;
    case "secondary":
      return <ButtonSecondary {...props} />;
    case "ghost":
      return <ButtonGhost {...props} />;
    case "link":
      return <ButtonLink {...props} />;
    default:
      return <ButtonDefault {...props} />;
  }
}

export { Button };
