import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-medium text-navy-700", className)} {...props} />
);

export const HelperText = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("mt-1.5 text-xs text-grey-500", className)} {...props} />
);

export const ErrorText = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("mt-1.5 text-xs font-medium text-red-600", className)} {...props} />
);

const fieldBase =
  "w-full rounded-xl border border-grey-200 bg-white px-4 py-2.5 text-sm text-navy-800 placeholder:text-grey-400 outline-none transition-all duration-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-grey-50 disabled:text-grey-400";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(fieldBase, invalid && "border-red-400 focus:border-red-400 focus:ring-red-100", className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-[96px] resize-y", invalid && "border-red-400 focus:border-red-400 focus:ring-red-100", className)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(fieldBase, "cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23717c92%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_0.9rem_center] bg-[length:16px] pr-10", invalid && "border-red-400", className)}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
