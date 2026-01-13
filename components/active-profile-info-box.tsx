"use client";

import { useActiveProfile } from "@/queries/use-active-profile-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActiveProfileInfoBox() {
  const { data: activeProfile, isLoading, isError } = useActiveProfile();

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Creating For</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !activeProfile) {
    return (
      <Card className="mb-6 bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-lg text-red-800">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">Could not load the active profile. Please try refreshing the page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">
          You are creating a hypercert for:
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <p className="font-semibold">{activeProfile.name}</p>
          <p className="text-sm text-gray-500">(@{activeProfile.handle})</p>
        </div>
      </CardContent>
    </Card>
  );
}
