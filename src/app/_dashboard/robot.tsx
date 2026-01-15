import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Plus,
  Cog,
  Zap,
  Hand,
  ArrowUp,
  Eye,
  Cpu,
  CircleDot,
  Wrench,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/robot")({
  component: RobotPage,
});

const subsystemTypes = [
  { value: "drivetrain", label: "Drivetrain", icon: Cog },
  { value: "intake", label: "Intake", icon: Zap },
  { value: "arm", label: "Arm", icon: Hand },
  { value: "lift", label: "Lift", icon: ArrowUp },
  { value: "claw", label: "Claw/Gripper", icon: Hand },
  { value: "shooter", label: "Shooter", icon: CircleDot },
  { value: "sensors", label: "Sensors", icon: Eye },
  { value: "vision", label: "Vision", icon: Eye },
  { value: "electronics", label: "Electronics", icon: Cpu },
  { value: "other", label: "Other", icon: Wrench },
];

const statusOptions = [
  { value: "concept", label: "Concept", color: "bg-slate-500" },
  { value: "design", label: "Design", color: "bg-purple-500" },
  { value: "prototyping", label: "Prototyping", color: "bg-yellow-500" },
  { value: "testing", label: "Testing", color: "bg-blue-500" },
  { value: "competition_ready", label: "Competition Ready", color: "bg-green-500" },
  { value: "needs_repair", label: "Needs Repair", color: "bg-red-500" },
];

function SubsystemCard({ subsystem }: {
  subsystem: {
    _id: string;
    name: string;
    type: string;
    description: string | null;
    status: string;
    progress: number;
    currentVersion: string | null;
    leadName: string | null;
    taskCount: number;
    recentLogs: number;
  };
}) {
  const typeInfo = subsystemTypes.find((t) => t.value === subsystem.type);
  const statusInfo = statusOptions.find((s) => s.value === subsystem.status);
  const Icon = typeInfo?.icon || Wrench;

  return (
    <Link to="/robot/$id" params={{ id: subsystem._id }}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{subsystem.name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">
                  {typeInfo?.label || subsystem.type}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`${statusInfo?.color} bg-opacity-20 border-0`}
            >
              <div className={`w-2 h-2 rounded-full ${statusInfo?.color} mr-1.5`} />
              {statusInfo?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subsystem.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {subsystem.description}
            </p>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{subsystem.progress}%</span>
            </div>
            <Progress value={subsystem.progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {subsystem.currentVersion && (
                <span className="font-mono text-xs bg-accent px-2 py-0.5 rounded">
                  {subsystem.currentVersion}
                </span>
              )}
              <span>{subsystem.taskCount} tasks</span>
            </div>
            {subsystem.leadName && (
              <span className="text-xs">Lead: {subsystem.leadName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RobotPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "drivetrain" as const,
    description: "",
    status: "concept" as const,
    progress: 0,
  });

  const subsystems = useQuery(api.robot.listSubsystems);
  const readiness = useQuery(api.robot.getRobotReadiness);
  const createSubsystem = useMutation(api.robot.createSubsystem);

  const handleCreate = async () => {
    if (!formData.name) return;

    await createSubsystem({
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      status: formData.status,
      progress: formData.progress,
    });

    setFormData({
      name: "",
      type: "drivetrain",
      description: "",
      status: "concept",
      progress: 0,
    });
    setCreateOpen(false);
  };

  if (subsystems === undefined || readiness === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Robot Subsystems
          </h1>
          <p className="text-muted-foreground">
            Track your robot&apos;s components and development progress
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subsystem
        </Button>
      </div>

      {/* Readiness Overview */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">Overall Robot Readiness</h2>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  {readiness.overallProgress}%
                </div>
                <div className="flex-1 max-w-md">
                  <Progress value={readiness.overallProgress} className="h-3" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {readiness.subsystemsReady} of {readiness.totalSubsystems} subsystems competition ready
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {Object.entries(readiness.byStatus).map(([status, count]) => {
                if (count === 0) return null;
                const statusInfo = statusOptions.find((s) => s.value === status);
                return (
                  <div key={status} className="text-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-3 h-3 rounded-full ${statusInfo?.color}`} />
                      <span className="text-2xl font-bold">{count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {status.replace("_", " ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          
          {readiness.needsAttention.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Needs Attention</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {readiness.needsAttention.map((s) => (
                  <Badge key={s._id} variant="outline" className="text-yellow-500 border-yellow-500/50">
                    {s.name} ({s.progress}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subsystem Grid */}
      {subsystems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No subsystems yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your robot&apos;s subsystems to track development progress
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Subsystem
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subsystems.map((subsystem) => (
            <SubsystemCard key={subsystem._id} subsystem={subsystem} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subsystem</DialogTitle>
            <DialogDescription>
              Add a new robot subsystem to track its development.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subsystem Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mecanum Drivetrain"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subsystemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Progress ({formData.progress}%)</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the subsystem..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              Add Subsystem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
