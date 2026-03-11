import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import {
  Trophy,
  Settings,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/")({
  component: DashboardPage,
});

// FTC Team Setup Banner - Prompts owner to configure team
function FtcSetupBanner() {
  const setupStatus = useQuery(api.settings.settings.getFtcSetupStatus);
  const initializeFtcTeam = useMutation(api.settings.settings.initializeFtcTeam);
  
  const [teamNumber, setTeamNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (setupStatus === undefined) {
    return null; // Loading
  }

  // Handle team initialization
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(teamNumber, 10);
    if (isNaN(num) || num < 1) {
      setMessage({ type: "error", text: "Please enter a valid team number" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const result = await initializeFtcTeam({ teamNumber: num });
      if (result.success) {
        setMessage({
          type: "success",
          text: `${result.message} Team events will update on the calendar automatically.`,
        });
      } else {
        setMessage({ type: "error", text: result.message });
      }
      setIsSubmitting(false);
    } catch (error) {
      setMessage({ type: "error", text: `Failed to initialize team. Please try again. ${error}` });
      setIsSubmitting(false);
    }
  };

  // Show setup prompt for owners who haven't configured yet
  if (setupStatus.requiresSetup) {
    return (
      <Card className="col-span-full border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configure Your FTC Team
          </CardTitle>
          <CardDescription>
            Enter your FTC team number to enable FTC Scout integration and track your team's performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="teamNumber">FTC Team Number</Label>
              <Input
                id="teamNumber"
                type="number"
                placeholder="e.g., 12345"
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                min="1"
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Setting up..." : "Configure Team"}
            </Button>
          </form>
          {message && (
            <p className={`mt-3 text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show team info card if configured
  if (setupStatus.isConfigured) {
    return (
      <Card className="col-span-full lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            FTC Team {setupStatus.ftcTeamNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            FTC Scout data now loads directly in the app. The calendar updates in
            the background after team changes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}




// Main Dashboard 
function DashboardPage() {
  const setupStatus = useQuery(api.settings.settings.getFtcSetupStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your project and FTC team overview.
        </p>
      </div>

      {/* FTC Setup Banner - Show prominently if setup is required */}
      {setupStatus?.requiresSetup && (
        <FtcSetupBanner />
      )}

      {/* Top Row - Countdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Show FTC Team card if configured */}
        {setupStatus?.isConfigured && setupStatus?.canConfigure && (
          <FtcSetupBanner />
        )}
      </div>
    </div>
  );
}
