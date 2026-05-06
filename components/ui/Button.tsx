import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-text-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
      secondary: 'bg-secondary text-text-primary hover:bg-secondary/90 shadow-lg shadow-secondary/20',
      outline: 'border border-border bg-transparent hover:bg-surface text-text-primary',
      ghost: 'bg-transparent hover:bg-surface text-text-primary',
      error: 'bg-error text-text-primary hover:bg-error/90 shadow-lg shadow-error/20',
      success: 'bg-success text-text-primary hover:bg-success/90 shadow-lg shadow-success/20',
    }

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg font-medium',
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
