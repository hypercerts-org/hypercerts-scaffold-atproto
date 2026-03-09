import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loaders for dynamically loaded form components
 * These match the pixel-perfect layout of each form step including the glass-panel wrapper
 */

// Reusable sub-components for common patterns
function FormInfoHeaderSkeleton({
  stepLabel,
  showDescription = true,
}: {
  stepLabel?: string;
  showDescription?: boolean;
}) {
  return (
    <div className="border-border/50 border-b px-6 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="w-full">
          {stepLabel && <Skeleton className="mb-2 h-5 w-24 rounded-full" />}
          <Skeleton className="mb-2 h-7 w-48" />
          {showDescription && <Skeleton className="h-4 w-full max-w-lg" />}
        </div>
      </div>
    </div>
  );
}

function FormFooterSkeleton() {
  return (
    <div className="border-border/50 flex items-center justify-between border-t pt-6">
      <Skeleton className="h-10 w-24" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function InputFieldSkeleton({
  label = true,
  helpText = false,
}: {
  label?: boolean;
  helpText?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && <Skeleton className="h-4 w-24" />}
      <Skeleton className="h-10 w-full" />
      {helpText && <Skeleton className="h-3 w-48" />}
    </div>
  );
}

function TextareaFieldSkeleton({
  label = true,
  rows = 4,
  charCount = false,
}: {
  label?: boolean;
  rows?: number;
  charCount?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && <Skeleton className="h-4 w-32" />}
      <Skeleton className="w-full" style={{ height: `${rows * 1.5 + 2}rem` }} />
      {charCount && <Skeleton className="h-3 w-24" />}
    </div>
  );
}

function IconLabelSkeleton() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Skeleton className="h-6 w-6 rounded-lg" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

// Step 1: Create Hypercert Form Skeleton
export function HypercertsCreateFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton />

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Title */}
          <InputFieldSkeleton />

          {/* Description */}
          <TextareaFieldSkeleton rows={4} charCount />

          {/* Work Period */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputFieldSkeleton />
            <InputFieldSkeleton />
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 2: Contribution Form Skeleton
export function ContributionFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton stepLabel="Step 2 of 5" />
      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Role */}
          <InputFieldSkeleton />

          {/* Contributors */}
          <div className="space-y-3">
            <IconLabelSkeleton />
            <Skeleton className="h-10 w-full rounded-lg" /> {/* Tabs */}
            <Skeleton className="h-32 w-full rounded-lg" />{" "}
            {/* Tab content area */}
          </div>

          {/* Description */}
          <TextareaFieldSkeleton rows={4} charCount />

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputFieldSkeleton />
            <InputFieldSkeleton />
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 2: Evidence Form Skeleton
export function EvidenceFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton stepLabel="Step 2 of 5" />

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Autofill button */}
          <div className="flex justify-end">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Title */}
          <InputFieldSkeleton />

          {/* Attachment Type */}
          <div className="space-y-2">
            <IconLabelSkeleton />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-64" />
          </div>

          {/* Short Description */}
          <TextareaFieldSkeleton rows={3} charCount />

          {/* Detailed Description */}
          <TextareaFieldSkeleton rows={5} charCount />

          {/* Evidence Content */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-72" />
          </div>

          {/* Location Section */}
          <div className="border-border/50 space-y-5 border-t pt-6">
            <IconLabelSkeleton />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-40" />
            </div>
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 3: Location Form Skeleton
export function LocationFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton stepLabel="Step 3 of 5" />

      <div className="px-6 py-6">
        <div className="space-y-6">
          {/* Spatial Configuration */}
          <div className="space-y-4">
            <IconLabelSkeleton />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputFieldSkeleton helpText />
              <InputFieldSkeleton helpText />
            </div>
          </div>

          {/* Location Type */}
          <div className="space-y-3">
            <IconLabelSkeleton />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Name & Description */}
          <div className="space-y-4">
            <InputFieldSkeleton />
            <TextareaFieldSkeleton rows={4} />
          </div>

          {/* Location Data */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-72" />
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 4: Measurement Form Skeleton
export function MeasurementFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton stepLabel="Step 4 of 5" />

      <div className="px-6 py-6">
        <div className="space-y-8">
          {/* Autofill button */}
          <div className="flex justify-end">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Measurers */}
          <div className="space-y-3">
            <IconLabelSkeleton />
            <Skeleton className="h-10 w-full rounded-lg" /> {/* Tabs */}
            <Skeleton className="h-32 w-full rounded-lg" />{" "}
            {/* Tab content area */}
          </div>

          {/* Measurement Data */}
          <div className="space-y-4">
            <IconLabelSkeleton />
            <InputFieldSkeleton />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputFieldSkeleton />
              <InputFieldSkeleton />
            </div>
          </div>

          {/* Optional sections toggle buttons */}
          <div className="space-y-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-36" />
          </div>

          {/* Locations Section */}
          <div className="border-border/50 space-y-5 border-t pt-6">
            <IconLabelSkeleton />
            <Skeleton className="h-9 w-36" />
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 5: Evaluation Form Skeleton
export function EvaluationFormSkeleton() {
  return (
    <div className="glass-panel animate-fade-in-up overflow-hidden rounded-2xl">
      <FormInfoHeaderSkeleton stepLabel="Step 5 of 5" />

      <div className="px-6 py-6">
        <div className="space-y-8">
          {/* Autofill button */}
          <div className="flex justify-end">
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Evaluators */}
          <div className="space-y-3">
            <IconLabelSkeleton />
            <Skeleton className="h-10 w-full rounded-lg" /> {/* Tabs */}
            <Skeleton className="h-32 w-full rounded-lg" />{" "}
            {/* Tab content area */}
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <IconLabelSkeleton />
            <TextareaFieldSkeleton label={false} rows={5} />
          </div>

          {/* Optional sections toggle buttons */}
          <div className="space-y-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>

          {/* Location Section */}
          <div className="border-border/50 space-y-5 border-t pt-6">
            <IconLabelSkeleton />
            <Skeleton className="h-9 w-36" />
          </div>

          <FormFooterSkeleton />
        </div>
      </div>
    </div>
  );
}

// Step 7: Completion Step Skeleton
// Note: This step uses gradient-mesh design, not glass-panel like other forms
export function CompletionStepSkeleton() {
  return (
    <div className="gradient-mesh animate-fade-in-up relative overflow-hidden rounded-2xl">
      <div className="noise-bg relative">
        <div className="relative z-10 px-8 py-12 text-center lg:py-16">
          {/* Success icon */}
          <div className="mb-6 inline-flex items-center justify-center">
            <Skeleton className="h-20 w-20 rounded-2xl" />
          </div>

          {/* Title */}
          <Skeleton className="mx-auto mb-2 h-8 w-64" />
          <Skeleton className="mx-auto mb-8 h-4 w-96 max-w-full" />

          {/* CID display */}
          <div className="mb-8 inline-block rounded-xl px-5 py-3">
            <Skeleton className="mx-auto mb-1 h-3 w-32" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}
