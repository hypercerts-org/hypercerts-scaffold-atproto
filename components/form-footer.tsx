"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
    <div className="flex items-center justify-end gap-4 pt-2">
      {onBack ? (
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <div />
      )}

      {!!onSkip && (
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onSkip}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4 rotate-180" />
          Skip
        </Button>
      )}

      <Button type="submit" disabled={saving || submitDisabled} className="min-w-[180px]">
        {saving ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}
