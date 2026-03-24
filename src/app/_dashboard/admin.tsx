import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreVertical,
  UserMinus,
  UserCheck,
  Settings,
  Users,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import {
  APP_ROLE_LABELS,
  APP_ROLES,
  PERMISSIONS,
  formatUserRoleSummary,
  type AppRole,
} from "@/lib/permissions";

export const Route = createFileRoute("/_dashboard/admin")({
  component: AdminPage,
});

function UsersTab() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.auth.users.listUsers,
    {},
    { initialNumItems: 20 }
  );

  const updateUserRoles = useMutation(api.auth.users.updateUserRoles);
  const removeUser = useMutation(api.auth.users.removeUser);

  const [removeUserId, setRemoveUserId] = useState<Id<"users"> | null>(null);

  const handleRoleToggle = async (
    userId: Id<"users">,
    roles: readonly AppRole[],
    role: AppRole,
    checked: boolean,
  ) => {
    const nextRoles = checked
      ? [...roles, role]
      : roles.filter((currentRole) => currentRole !== role);
    await updateUserRoles({ userId, roles: nextRoles });
  };

  const handleRemoveUser = async () => {
    if (removeUserId) {
      await removeUser({ userId: removeUserId, deleteFromClerk: true });
      setRemoveUserId(null);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const name = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length} users
        </p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {results.map((user) => (
            <Card key={user._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.clerkInfo.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {getInitials(user.clerkInfo.firstName, user.clerkInfo.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {user.clerkInfo.firstName || user.clerkInfo.lastName
                        ? `${user.clerkInfo.firstName ?? ""} ${user.clerkInfo.lastName ?? ""}`.trim()
                        : "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.clerkInfo.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={user.isOwner ? "default" : "secondary"}
                  >
                    {formatUserRoleSummary(user)}
                  </Badge>

                  {!user.isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {APP_ROLES.map((role) => (
                          <DropdownMenuCheckboxItem
                            key={role}
                            checked={user.roles.includes(role)}
                            onCheckedChange={(checked) =>
                              handleRoleToggle(user._id, user.roles, role, checked === true)
                            }
                          >
                            {APP_ROLE_LABELS[role]}
                          </DropdownMenuCheckboxItem>
                        ))}
                        <DropdownMenuSeparator />
                        <button
                          type="button"
                          onClick={() => setRemoveUserId(user._id)}
                          className="focus:bg-accent focus:text-accent-foreground text-red-600 data-[variant=destructive]:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 rounded-sm px-2 py-1.5 text-sm relative flex w-full cursor-default items-center gap-2 outline-hidden select-none"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove User
                        </button>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More
          </Button>
        </div>
      )}

      <AlertDialog
        open={removeUserId !== null}
        onOpenChange={(open) => !open && setRemoveUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the user from the system and delete their Clerk account.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WaitlistTab() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.auth.users.listWaitlist,
    {},
    { initialNumItems: 20 }
  );

  const approveFromWaitlist = useMutation(api.auth.users.approveFromWaitlist);
  const removeFromWaitlist = useMutation(api.auth.users.removeFromWaitlist);

  const handleApprove = async (waitlistId: Id<"waitlist">) => {
    await approveFromWaitlist({ waitlistId });
  };

  const handleRemove = async (waitlistId: Id<"waitlist">) => {
    await removeFromWaitlist({ waitlistId, deleteFromClerk: true });
  };

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No users on the waitlist</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {results.map((entry) => (
            <Card key={entry._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {entry.clerkInfo.imageUrl && (
                    <img
                      src={entry.clerkInfo.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {entry.clerkInfo.firstName || entry.clerkInfo.lastName
                        ? `${entry.clerkInfo.firstName ?? ""} ${entry.clerkInfo.lastName ?? ""}`.trim()
                        : "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.clerkInfo.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(entry._id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleRemove(entry._id)}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const settings = useQuery(api.settings.settings.getAllSettings);
  const ftcSettings = useQuery(api.settings.settings.getFtcSetupStatus);
  const setWaitlistEnabled = useMutation(api.settings.settings.setWaitlistEnabled);
  const setFtcTeamSettings = useMutation(api.settings.settings.setFtcTeamSettings);
  const requestFtcCalendarSync = useMutation(
    api.settings.settings.requestFtcCalendarSync,
  );

  const [teamNumber, setTeamNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Initialize form when ftcSettings loads
  useEffect(() => {
    if (ftcSettings?.ftcTeamNumber) {
      setTeamNumber(ftcSettings.ftcTeamNumber.toString());
      return;
    }
    setTeamNumber("");
  }, [ftcSettings]);

  if (settings === undefined || ftcSettings === undefined) {
    return <Skeleton className="h-24 w-full" />;
  }

  const handleSaveFtcSettings = async () => {
    setIsSaving(true);
    setSyncMessage(null);
    try {
      const updates: { teamNumber?: number } = {};
      if (teamNumber) updates.teamNumber = parseInt(teamNumber, 10);
      await setFtcTeamSettings(updates);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save FTC settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await requestFtcCalendarSync({});
      setSyncMessage(result.message);
    } catch (error) {
      console.error("Failed to queue FTC calendar sync:", error);
      setSyncMessage("Failed to queue the FTC calendar sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* FTC Scout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            FTC Scout Integration
          </CardTitle>
          <CardDescription>
            Configure the shared FTC team number used by client-side FTC Scout pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ftcTeamNumber">Team Number</Label>
                <Input
                  id="ftcTeamNumber"
                  type="number"
                  placeholder="e.g., 12345"
                  value={teamNumber}
                  onChange={(e) => setTeamNumber(e.target.value)}
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveFtcSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {ftcSettings.isConfigured
                      ? `Team ${ftcSettings.ftcTeamNumber}`
                      : "Not configured"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    {ftcSettings.isConfigured ? "Edit" : "Configure"}
                  </Button>
                  {ftcSettings.isConfigured && (
                    <Button
                      variant="outline"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                      />
                      {isSyncing ? "Syncing..." : "Sync Calendar"}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Event pages fetch FTC Scout directly in the browser. Calendar team
                events update in the background after changes.
              </p>
              {syncMessage && (
                <p className="text-sm text-muted-foreground">{syncMessage}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waitlist Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist</CardTitle>
          <CardDescription>
            When enabled, new users are added to the waitlist for approval before
            gaining access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Status: {settings.waitlistEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.waitlistEnabled
                  ? "New users must be approved by an admin"
                  : "New users are automatically rejected"}
              </p>
            </div>
            <Button
              variant={settings.waitlistEnabled ? "default" : "outline"}
              onClick={() => setWaitlistEnabled({ enabled: !settings.waitlistEnabled })}
            >
              {settings.waitlistEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminPage() {
  const { user, isLoading, hasPermission } = useAuthContext();
  const navigate = useNavigate();
  const canAccessAdmin = hasPermission(PERMISSIONS.adminAccess);

  useEffect(() => {
    if (!isLoading && user && !canAccessAdmin) {
      navigate({ to: "/" });
    }
  }, [canAccessAdmin, isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">
          Manage users, teams, and application settings
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="waitlist" className="gap-2">
            <Users className="h-4 w-4" />
            Waitlist
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Users className="h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="waitlist">
          <WaitlistTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
