import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

type ButtonSize = "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg" | "icon-xl" | "icon-2xl";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

type AtomicButtonProps = Omit<ButtonProps, "variant">;

type SizeClassVariant = "default" | "brand" | "outline";

const SIZE_MAP: Record<SizeClassVariant, Record<ButtonSize, string>> = {
  brand: {
    sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
    lg: "h-10 px-6 has-[>svg]:px-4",
    xl: "h-12 px-8",
    icon: "size-9",
    "icon-sm": "size-8",
    "icon-lg": "size-10",
    "icon-xl": "size-11",
    "icon-2xl": "size-12",
    default: "h-11 px-6 py-2 has-[>svg]:px-4",
  },
  outline: {
    sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
    lg: "h-10 px-6 has-[>svg]:px-4",
    xl: "h-11 px-8",
    icon: "size-9",
    "icon-sm": "size-8",
    "icon-lg": "size-10",
    "icon-xl": "size-11",
    "icon-2xl": "size-12",
    default: "h-10 px-4 py-2 has-[>svg]:px-3",
  },
  default: {
    sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
    lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
    xl: "h-11 rounded-xl px-8",
    icon: "size-9",
    "icon-sm": "size-8",
    "icon-lg": "size-10",
    "icon-xl": "size-11",
    "icon-2xl": "size-12",
    default: "h-9 px-4 py-2 has-[>svg]:px-3",
  },
};

const getSizeClasses = (size: ButtonSize, variant: ButtonVariant = "default") => {
  const variantMap: SizeClassVariant = variant === "brand" ? "brand" : variant === "outline" ? "outline" : "default";
  return SIZE_MAP[variantMap][size];
};

const ButtonDefault = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/20 dark:focus-visible:ring-ring/40 ${getSizeClasses(size)} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonDefault.displayName = "ButtonDefault";

const ButtonBrand = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-linear-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 ${getSizeClasses(size, "brand")} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonBrand.displayName = "ButtonBrand";

const ButtonDestructive = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 ${getSizeClasses(size)} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonDestructive.displayName = "ButtonDestructive";

const ButtonOutline = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 ${getSizeClasses(size, "outline")} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonOutline.displayName = "ButtonOutline";

const ButtonSecondary = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-secondary text-secondary-foreground hover:bg-secondary/80 ${getSizeClasses(size)} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonSecondary.displayName = "ButtonSecondary";

const ButtonGhost = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 ${getSizeClasses(size)} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonGhost.displayName = "ButtonGhost";

const ButtonLink = React.forwardRef<HTMLButtonElement, AtomicButtonProps>(
  ({ className, size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-primary underline-offset-4 hover:underline ${getSizeClasses(size)} ${className || ""}`}
        {...props}
      />
    );
  }
);
ButtonLink.displayName = "ButtonLink";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "default", ...props }, ref) => {
  switch (variant) {
    case "brand":
      return <ButtonBrand ref={ref} {...props} />;
    case "destructive":
      return <ButtonDestructive ref={ref} {...props} />;
    case "outline":
      return <ButtonOutline ref={ref} {...props} />;
    case "secondary":
      return <ButtonSecondary ref={ref} {...props} />;
    case "ghost":
      return <ButtonGhost ref={ref} {...props} />;
    case "link":
      return <ButtonLink ref={ref} {...props} />;
    default:
      return <ButtonDefault ref={ref} {...props} />;
  }
});
Button.displayName = "Button";
