"use client";

import {
  FileText,
  Users,
  Paperclip,
  MapPin,
  BarChart3,
  ClipboardCheck,
  Check,
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Details", icon: FileText },
  { id: 2, label: "Contributors", icon: Users },
  { id: 3, label: "Evidence", icon: Paperclip },
  { id: 4, label: "Location", icon: MapPin },
  { id: 5, label: "Measurement", icon: BarChart3 },
  { id: 6, label: "Evaluation", icon: ClipboardCheck },
] as const;

export function StepperHeader({ step }: { step: number }) {
  return (
    <>
      {/* Desktop: Vertical sidebar stepper */}
      <nav className="hidden lg:flex flex-col gap-1" aria-label="Create flow progress">
        {STEPS.map((s, idx) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          const isUpcoming = step < s.id;
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex items-start gap-3">
              {/* Vertical rail: icon + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    relative flex h-9 w-9 items-center justify-center rounded-xl
                    transition-all duration-300 ease-out
                    ${isCompleted
                      ? "bg-create-accent text-create-accent-foreground shadow-sm"
                      : isActive
                        ? "bg-create-accent text-create-accent-foreground shadow-md animate-pulse-glow"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
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
                    className={`
                      w-0.5 flex-1 min-h-6 my-1 rounded-full transition-colors duration-300
                      ${isCompleted ? "stepper-line" : "stepper-line-inactive"}
                    `}
                  />
                )}
              </div>

              {/* Label */}
              <div className="pt-1.5 pb-4">
                <p
                  className={`
                    text-sm font-[family-name:var(--font-outfit)] leading-tight transition-colors duration-200
                    ${isActive
                      ? "font-semibold text-foreground"
                      : isCompleted
                        ? "font-medium text-create-accent"
                        : "font-normal text-muted-foreground"
                    }
                  `}
                >
                  {s.label}
                </p>
                {isActive && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Step {s.id} of {STEPS.length}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Mobile: Horizontal progress bar */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-[family-name:var(--font-outfit)] font-medium text-foreground">
            {step <= STEPS.length ? STEPS[step - 1]?.label : "Complete"}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.min(step, STEPS.length)} / {STEPS.length}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-create-accent transition-all duration-500 ease-out"
            style={{
              width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%`,
            }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2 px-0.5">
          {STEPS.map((s) => {
            const isCompleted = step > s.id;
            const isActive = step === s.id;
            return (
              <div
                key={s.id}
                className={`
                  h-2 w-2 rounded-full transition-all duration-300
                  ${isCompleted
                    ? "bg-create-accent"
                    : isActive
                      ? "bg-create-accent animate-pulse-glow"
                      : "bg-muted-foreground/30"
                  }
                `}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
