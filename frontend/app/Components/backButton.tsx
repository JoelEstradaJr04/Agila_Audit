'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/app/lib/utils";

const backButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm border border-gray-200 hover:scale-[1.03]",
  {
    variants: {
      variant: {
        default:
          "bg-white text-gray-700 hover:bg-[#961C1E] hover:text-white hover:border-[#961C1E] rounded-lg",
        outline:
          "bg-white text-gray-700 hover:bg-[#961C1E] hover:text-white hover:border-[#961C1E] rounded-lg",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 rounded-lg",
        ghost:
          "bg-white text-gray-700 hover:bg-[#961C1E] hover:text-white hover:border-[#961C1E] rounded-lg border-0 shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg gap-1.5 px-3",
        lg: "h-12 rounded-lg px-6",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BackButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof backButtonVariants> {
  href?: string;
  showIcon?: boolean;
  iconPosition?: "left" | "right";
}

export function BackButton({
  className,
  variant,
  size,
  href,
  showIcon = true,
  iconPosition = "left",
  children = "",
  onClick,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      data-slot="back-button"
      className={cn(backButtonVariants({ variant, size, className }))}
      onClick={handleClick}
      style={{paddingLeft:30, paddingRight:30}}
      {...props}
    >
      {showIcon && iconPosition === "left" && (
        <ArrowLeft className="size-4 shrink-0" />
      )}
      {children}
      {showIcon && iconPosition === "right" && (
        <ArrowLeft className="size-4 shrink-0 rotate-180" />
      )}
    </button>
  );
}

export { backButtonVariants };
