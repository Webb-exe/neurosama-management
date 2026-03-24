import { type ReactNode, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { ScoutingLoading } from "@/components/scouting/ScoutingLoading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/scouting/public/$token")({
  component: PublicScoutingLinkPage,
});

function PublicScoutingLinkPage() {
  const params = Route.useParams();
  const token = params.token;
  const link = useQuery(api.scouting.publicLinks.getPublicLinkLanding, { token });
  const startPublicLinkSession = useMutation(api.scouting.publicLinks.startPublicLinkSession);
  const [teamNumber, setTeamNumber] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!link) {
    return <ScoutingLoading message="Preparing the public form link…" variant="page" />;
  }

  if (link.status === "invalid") {
    return (
      <CenteredCard title="Invalid Link">
        <p className="text-sm text-muted-foreground">
          This public form link does not exist or is no longer available.
        </p>
      </CenteredCard>
    );
  }

  if (link.status === "disabled") {
    return (
      <CenteredCard title="Link Closed">
        <p className="text-sm text-muted-foreground">
          {link.label} for {link.formName} in {link.cycleName} is not accepting new sessions.
        </p>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full rounded-[32px] border-border/70 shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{link.label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {link.formName} · {link.cycleName} · version {link.formVersionNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {link.description || "Enter the team number to start a tracked scouting session."}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              {link.accessMode === "selectedTeams"
                ? `Only approved teams can open this form. ${link.teamCount} team${
                    link.teamCount === 1 ? "" : "s"
                  } are currently allowed.`
                : link.anyTeamSessionLimit === null
                  ? "Any team can open this form."
                  : `Any team can open this form up to ${link.anyTeamSessionLimit} time${
                      link.anyTeamSessionLimit === 1 ? "" : "s"
                    }.`}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="public-team-number"
                className="text-sm font-medium text-foreground"
              >
                Team number
              </label>
              <Input
                id="public-team-number"
                type="number"
                min="1"
                placeholder="Enter FTC team number"
                value={teamNumber}
                onChange={(event) => setTeamNumber(event.target.value)}
              />
            </div>

            {submitError ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <Button
              className="w-full"
              disabled={!teamNumber.trim() || isStarting}
              onClick={async () => {
                setSubmitError(null);
                setIsStarting(true);
                try {
                  const result = await startPublicLinkSession({
                    token,
                    teamNumber: Number(teamNumber),
                  });
                  window.location.assign(result.path);
                } catch (error) {
                  setSubmitError(
                    error instanceof Error
                      ? error.message
                      : "Could not start a session from this public link.",
                  );
                  setIsStarting(false);
                }
              }}
            >
              {isStarting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Starting session...
                </>
              ) : (
                "Continue to form"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CenteredCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
        <Card className="w-full rounded-[32px] border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
