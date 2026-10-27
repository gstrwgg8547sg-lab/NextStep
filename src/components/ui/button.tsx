import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] px-[18px] text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#657c56] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#344b38] text-white hover:bg-[#415f46]",
        outline:
          "border border-[#dadfd4] bg-white text-[#344b38] hover:bg-[#e8eee3]",
        ghost: "text-[#52654c] hover:bg-[#e8eee3]",
        secondary: "bg-[#e8eee3] text-[#344b38] hover:bg-[#dce5d5]",
      },
      size: { default: "", sm: "px-3 text-xs", icon: "size-11 p-0" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Button, buttonVariants };
