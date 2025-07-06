import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 border border-border/50",
        outline: "border border-border bg-background text-foreground hover:bg-muted/50 active:bg-muted/70",
        ghost: "text-foreground hover:bg-muted/50 active:bg-muted/70 border-0",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm",
        subtle: "bg-muted/30 text-muted-foreground hover:bg-muted/50 active:bg-muted/70",
        success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800 shadow-sm",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-sm",
        sm: "h-8 px-3 text-sm rounded-md",
        default: "h-10 px-4 py-2 rounded-md",
        lg: "h-11 px-6 text-base rounded-md",
        xl: "h-12 px-8 text-lg rounded-lg",
        icon: "h-10 w-10 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-lg",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "medium",
      rounded: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    weight,
    rounded,
    asChild = false, 
    leftIcon,
    rightIcon,
    loading = false,
    loadingText,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, weight, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2 flex-shrink-0">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2 flex-shrink-0">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 