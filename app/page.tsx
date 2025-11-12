"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOAuthContext } from "@/providers/OAuthProviderSSR";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  PlusCircle,
  ListOrdered,
  Shield,
  Pencil,
} from "lucide-react";

export default function Home() {
  const { atProtoAgent, session } = useOAuthContext();

  const userDid = atProtoAgent?.assertDid || undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Hypercert Starter Demo
            </h1>
            <Badge variant="outline">View Only</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            A minimal demo using{" "}
            <span className="font-medium">AT Protocol</span> and{" "}
            <span className="font-medium">Hypercerts lexicons</span> to create,
            edit, and view hypercert claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/create" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Hypercert
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/my-hypercerts" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              My Hypercerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Session / DID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Session</CardTitle>
          <CardDescription>
            {session
              ? "Signed in with an active AT Protocol session."
              : "You are not signed in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">DID:&nbsp;</span>
            <span className="font-mono break-all">{userDid || "—"}</span>
          </div>
          {!session && (
            <p className="text-sm text-muted-foreground">
              Sign in to create new hypercerts and see your list under{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                /my-hypercerts
              </code>
              .
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
            <CardDescription>
              Jump straight into common actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Create a Hypercert</div>
                <p className="text-sm text-muted-foreground">
                  Start a new claim with title, description, scope, image, and
                  timeframe.
                </p>
              </div>
              <Button asChild>
                <Link href="/create" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  /create
                </Link>
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">View My Hypercerts</div>
                <p className="text-sm text-muted-foreground">
                  Browse the records you’ve created in this demo.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/my-hypercerts" className="gap-2">
                  <ListOrdered className="h-4 w-4" />
                  /my-hypercerts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-lg">How This Demo Works</CardTitle>
            <CardDescription>
              AT Proto + Hypercerts, in a nutshell.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5" />
              <p>
                <span className="font-medium">AT Protocol</span> handles
                identity and data via records on your repo. We interact through
                an authenticated{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  atProtoAgent
                </code>
                .
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 mt-0.5" />
              <p>
                <span className="font-medium">Hypercerts Lexicons</span> define
                the record shapes like{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  org.hypercerts.claim
                </code>{" "}
                and{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  org.hypercerts.claim.contribution
                </code>
                . Validation is done with the generated TypeScript helpers.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Pencil className="h-4 w-4 mt-0.5" />
              <p>
                You can <span className="font-medium">create</span> a claim at{" "}
                <code className="px-1 py-0.5 rounded bg-muted">/create</code>,{" "}
                <span className="font-medium">view</span> your claims at{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  /my-hypercerts
                </code>
                , and <span className="font-medium">edit</span> a specific claim
                at{" "}
                <code className="px-1 py-0.5 rounded bg-muted">
                  /[hypercertId]/edit
                </code>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Developer notes */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg">Developer Notes</CardTitle>
          <CardDescription>
            Where things live and what to expect.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Records are written to your AT Proto repo using{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                com.atproto.repo.createRecord
              </code>
              , updated via{" "}
              <code className="px-1 py-0.5 rounded bg-muted">putRecord</code>,
              and read via{" "}
              <code className="px-1 py-0.5 rounded bg-muted">getRecord</code>.
            </li>
            <li>
              Claims use the{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                org.hypercerts.claim
              </code>{" "}
              schema (title, shortDescription, workScope, image, timeframe).
            </li>
            <li>
              Contributions use{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                org.hypercerts.claim.contribution
              </code>{" "}
              and can be linked from a claim via strong refs.
            </li>
            <li>
              The edit page is view/edit capable. For a pure read-only
              presentation, use a view page that only loads and renders record
              fields.
            </li>
          </ul>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/create" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Go to /create
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/my-hypercerts" className="gap-2">
                <ListOrdered className="h-4 w-4" />
                Go to /my-hypercerts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
