"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function FormFooter({
  onBack,
  onSkip,
  submitLabel,
  savingLabel,
  saving,
  submitDisabled,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  submitLabel: string;
  savingLabel: string;
  saving: boolean;
  submitDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-border/50">
      <div>
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground font-[family-name:var(--font-outfit)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!!onSkip && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onSkip}
            className="gap-2 font-[family-name:var(--font-outfit)]"
          >
            Skip
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="submit"
          disabled={saving || submitDisabled}
          className="min-w-[160px] bg-create-accent hover:bg-create-accent/90 text-create-accent-foreground font-[family-name:var(--font-outfit)] font-medium shadow-sm transition-all duration-200 hover:shadow-md"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {savingLabel}
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
