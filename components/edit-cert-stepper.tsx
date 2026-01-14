export function StepperHeader({ step }: { step: number }) {
  const steps = [
    { id: 1, label: "Hypercert Details" },
    { id: 2, label: "Contributions" },
    { id: 3, label: "Evidence" },
    { id: 4, label: "Location" },
    { id: 5, label: "Evaluation" },
    { id: 6, label: "Measurement" },
  ];
  return (
    <div className="flex items-center justify-center gap-6 my-6">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full grid place-items-center text-sm font-medium ${
              step === s.id ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {s.id}
          </div>
          <span
            className={`text-sm ${
              step === s.id ? "font-semibold" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </span>
          {idx < steps.length - 1 && (
            <div className="w-10 h-1.5 bg-border mx-2" />
          )}
        </div>
      ))}
    </div>
  );
}
