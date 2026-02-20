"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Upload } from "lucide-react";
import { Button } from "./ui/button";

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
  fileUploadDisabled = true,
  accept,
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
  fileUploadDisabled?: boolean;
  accept?: string;
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="inline-flex rounded-md border gap-2 px-2 py-1 divide-x overflow-hidden">
        <Button
          type="button"
          variant={mode === "link" ? "default" : "outline"}
          onClick={() => onModeChange("link")}
        >
          <LinkIcon className="h-4 w-4" />
          Link
        </Button>
        <Button
          disabled={fileUploadDisabled}
          variant={mode === "file" ? "default" : "outline"}
          type="button"
          onClick={() => onModeChange("file")}
        >
          <Upload className="h-4 w-4" />
          File {fileUploadDisabled ? "(Coming Soon)" : ""}
        </Button>
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
          <Input
            type="file"
            onChange={onFileChange}
            required={required}
            accept={accept}
          />
          <p className="text-xs text-muted-foreground">{fileHelpText}</p>
        </div>
      )}
    </div>
  );
}
