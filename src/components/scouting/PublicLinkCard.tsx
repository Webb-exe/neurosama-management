import { useMemo, useState } from "react";
import { Copy, ExternalLink, PauseCircle, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type PublicLinkTeamConfig = {
  _id: string;
  teamNumber: number;
  sessionLimit: number | null;
  sessionsCreated: number;
  sessionsSubmitted: number;
  lastSessionCreatedAt: number | null;
  lastSessionSubmittedAt: number | null;
};

export type PublicLinkCardData = {
  _id: string;
  cycleName: string;
  formName: string;
  formVersionNumber: number;
  label: string;
  description: string;
  status: "active" | "disabled";
  accessMode: "anyTeam" | "selectedTeams";
  anyTeamSessionLimit: number | null;
  totalSessionsCreated: number;
  totalSessionsSubmitted: number;
  lastSessionCreatedAt: number | null;
  lastSessionSubmittedAt: number | null;
  createdAt: number;
  updatedAt: number;
  path: string;
  teamConfigs: PublicLinkTeamConfig[];
};

type Props = {
  link: PublicLinkCardData;
  showFormName?: boolean;
  showCycleName?: boolean;
  onToggleStatus?: (publicLinkId: string, status: "active" | "disabled") => Promise<void> | void;
};

function formatTimestamp(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "—";
}

function formatLimit(limit: number | null) {
  return limit === null ? "Unlimited" : String(limit);
}

export function PublicLinkCard({
  link,
  showFormName = false,
  showCycleName = false,
  onToggleStatus,
}: Props) {
  const [isCopying, setIsCopying] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const absolutePath = useMemo(() => {
    if (typeof window === "undefined") {
      return link.path;
    }
    return `${window.location.origin}${link.path}`;
  }, [link.path]);
  const nextStatus = link.status === "active" ? "disabled" : "active";
  const teamSectionTitle =
    link.accessMode === "selectedTeams" ? "Allowed teams and usage" : "Team usage";
  const accessSummary =
    link.accessMode === "selectedTeams"
      ? `${link.teamConfigs.length} allowed team${link.teamConfigs.length === 1 ? "" : "s"}`
      : link.anyTeamSessionLimit === null
        ? "Any team can start unlimited sessions"
        : `Any team can start up to ${link.anyTeamSessionLimit} session${
            link.anyTeamSessionLimit === 1 ? "" : "s"
          }`;

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{link.label}</CardTitle>
              <Badge variant={link.status === "active" ? "default" : "secondary"}>
                {link.status}
              </Badge>
              <Badge variant="outline">
                {link.accessMode === "selectedTeams" ? "Selected teams" : "Any team"}
              </Badge>
              <Badge variant="outline">v{link.formVersionNumber}</Badge>
            </div>
            <CardDescription>
              {link.description || "No description provided."}
            </CardDescription>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {showFormName ? <span>Form: {link.formName}</span> : null}
              {showCycleName ? <span>Cycle: {link.cycleName}</span> : null}
              <span>{accessSummary}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsCopying(true);
                try {
                  await navigator.clipboard.writeText(absolutePath);
                } finally {
                  window.setTimeout(() => setIsCopying(false), 600);
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              {isCopying ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={absolutePath} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </a>
            </Button>
            {onToggleStatus ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isToggling}
                onClick={async () => {
                  setIsToggling(true);
                  try {
                    await onToggleStatus(link._id, nextStatus);
                  } finally {
                    setIsToggling(false);
                  }
                }}
              >
                {nextStatus === "disabled" ? (
                  <PauseCircle className="mr-2 h-4 w-4" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {nextStatus === "disabled" ? "Disable" : "Enable"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Sessions created" value={String(link.totalSessionsCreated)} />
          <Stat label="Sessions submitted" value={String(link.totalSessionsSubmitted)} />
          <Stat label="Last session started" value={formatTimestamp(link.lastSessionCreatedAt)} />
          <Stat label="Last session submitted" value={formatTimestamp(link.lastSessionSubmittedAt)} />
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
          <div>Public URL: {absolutePath}</div>
          <div className="mt-1">
            Created {new Date(link.createdAt).toLocaleString()} · Updated{" "}
            {new Date(link.updatedAt).toLocaleString()}
          </div>
        </div>

        {link.teamConfigs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
            {link.accessMode === "selectedTeams"
              ? "No allowed teams are configured for this link."
              : "No teams have created a session from this link yet."}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">{teamSectionTitle}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {link.teamConfigs.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell className="font-medium">{team.teamNumber}</TableCell>
                    <TableCell>{formatLimit(team.sessionLimit)}</TableCell>
                    <TableCell>{team.sessionsCreated}</TableCell>
                    <TableCell>{team.sessionsSubmitted}</TableCell>
                    <TableCell>{formatTimestamp(team.lastSessionCreatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
