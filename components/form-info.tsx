"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";

export default function FormInfo({
  title,
  description,
  stepLabel,
  children,
}: {
  title: string;
  description?: string;
  stepLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                {stepLabel && (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stepLabel}
                  </p>
                )}
                <CardTitle className={`text-2xl ${stepLabel ? "mt-1" : ""}`}>
                  {title}
                </CardTitle>
                {description && (
                  <CardDescription className="mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
