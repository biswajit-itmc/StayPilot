import { cn } from "@/lib/utils";

/** Label + control + hint or error. Pass the same `id` to the control. */
export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-meta !text-brown-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClass =
  "h-9 w-full rounded-lg border border-input bg-surface px-3 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-brown-ink aria-invalid:ring-brown/20 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClass =
  "min-h-20 w-full rounded-lg border border-input bg-surface px-3 py-2 text-body outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-brown-ink";
