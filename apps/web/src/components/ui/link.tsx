import * as React from "react";
import NextLink from "next/link";
import { Slot } from "@radix-ui/react-slot";

interface LinkProps extends React.ComponentProps<typeof NextLink> {
  variant?: "default" | "brand" | "outline" | "ghost";
  asChild?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : NextLink;

    const variants = {
      default: "text-red-500 hover:text-red-600 font-medium",
      brand:
        "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-red-500 to-pink-600 rounded-lg hover:opacity-90 transition-opacity",
      outline:
        "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-foreground border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
      ghost: "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
    };

    return <Comp className={`${variants[variant]} ${className || ""}`} ref={ref} {...props} />;
  }
);
Link.displayName = "Link";

export { Link };
