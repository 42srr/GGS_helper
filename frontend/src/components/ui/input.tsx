import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-line bg-white px-3 py-1 text-base text-primary shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-secondary/50",
        "focus-visible:border-accent focus-visible:ring-accent/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-red-600/20 aria-invalid:border-red-600",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-primary",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
