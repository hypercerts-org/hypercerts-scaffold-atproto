"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type RightsState = {
  name: string;
  type: string;
  description: string;
};

export default function HypercertRightsFields({
  value,
  onChange,
}: {
  value: RightsState;
  onChange: (next: RightsState) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rightsName">Rights Name *</Label>
        <Input
          id="rightsName"
          placeholder="e.g., Creative Commons Attribution-ShareAlike 4.0"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rightsType">Rights Identifier *</Label>
        <Input
          id="rightsType"
          placeholder="e.g., cc-by-sa-4.0, all-rights-reserved"
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rightsDescription">Rights Description *</Label>
        <Textarea
          id="rightsDescription"
          placeholder="Describe how this hypercert can be used, shared, or remixed..."
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={5}
          required
        />
      </div>
    </div>
  );
}
