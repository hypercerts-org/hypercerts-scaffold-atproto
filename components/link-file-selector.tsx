"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Upload } from "lucide-react";

type Mode = "link" | "file";

export default function LinkFileSelector({
  label,
  mode,
  onModeChange,
  urlPlaceholder,
  onUrlChange,
  onFileChange,
  required,
  urlHelpText,
  fileHelpText,
}: {
  label: string;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  urlPlaceholder: string;
  onUrlChange: (value: string) => void;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  urlHelpText: string;
  fileHelpText: string;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="inline-flex rounded-md border divide-x overflow-hidden">
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
            mode === "link"
              ? "bg-primary text-primary-foreground"
              : "bg-background"
          }`}
          onClick={() => onModeChange("link")}
        >
          <LinkIcon className="h-4 w-4" />
          Link
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 text-sm ${
            mode === "file"
              ? "bg-primary text-primary-foreground"
              : "bg-background"
          }`}
          onClick={() => onModeChange("file")}
        >
          <Upload className="h-4 w-4" />
          File
        </button>
      </div>

      {mode === "link" ? (
        <div className="space-y-2">
          <Input
            type="url"
            placeholder={urlPlaceholder}
            onChange={(e) => onUrlChange(e.target.value)}
            required={required}
          />
          <p className="text-xs text-muted-foreground">{urlHelpText}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Input type="file" onChange={onFileChange} required={required} />
          <p className="text-xs text-muted-foreground">{fileHelpText}</p>
        </div>
      )}
    </div>
  );
}
