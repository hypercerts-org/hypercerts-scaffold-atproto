"use client";

import {
  FileText,
  Paperclip,
  MapPin,
  BarChart3,
  ClipboardCheck,
  Check,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Details", icon: FileText },
  { id: 2, label: "Evidence", icon: Paperclip },
  { id: 3, label: "Location", icon: MapPin },
  { id: 4, label: "Measurement", icon: BarChart3 },
  { id: 5, label: "Evaluation", icon: ClipboardCheck },
] as const;

export function StepperHeader({ step }: { step: number }) {
  return (
    <>
      {/* Desktop: Vertical sidebar stepper */}
      <nav
        className="hidden flex-col gap-1 lg:flex"
        aria-label="Create flow progress"
      >
        {STEPS.map((s, idx) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-start gap-3">
              {/* Vertical rail: icon + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ease-out ${
                    isCompleted
                      ? "bg-create-accent text-create-accent-foreground shadow-sm"
                      : isActive
                        ? "bg-create-accent text-create-accent-foreground animate-pulse-glow shadow-md"
                        : "bg-muted text-muted-foreground"
                  } `}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`my-1 min-h-6 w-0.5 flex-1 rounded-full transition-colors duration-300 ${isCompleted ? "stepper-line" : "stepper-line-inactive"} `}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pt-1.5 pb-4">
                <p
                  className={`font-[family-name:var(--font-outfit)] text-sm leading-tight transition-colors duration-200 ${
                    isActive
                      ? "text-foreground font-semibold"
                      : isCompleted
                        ? "text-create-accent font-medium"
                        : "text-muted-foreground font-normal"
                  } `}
                >
                  {s.label}
                </p>
                {isActive && (
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Step {s.id} of {STEPS.length}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Mobile: Horizontal progress bar */}
      <div className="mb-6 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-foreground font-[family-name:var(--font-outfit)] text-sm font-medium">
            {step <= STEPS.length ? STEPS[step - 1]?.label : "Complete"}
          </p>
          <p className="text-muted-foreground text-xs">
            {Math.min(step, STEPS.length)} / {STEPS.length}
          </p>
        </div>
        <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-create-accent h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%`,
            }}
          />
        </div>
        {/* Step dots */}
        <div className="mt-2 flex justify-between px-0.5">
          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            return (
              <div
                key={s.id}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-create-accent"
                    : isActive
                      ? "bg-create-accent animate-pulse-glow"
                      : "bg-muted-foreground/30"
                } `}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
