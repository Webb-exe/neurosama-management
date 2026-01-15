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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { TeamForm } from "@/components/teams/TeamForm";
import { TeamCard } from "@/components/teams/TeamCard";
import {
  MoreVertical,
  Shield,
  UserMinus,
  Plus,
  Settings,
  Users,
  UserCheck,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

export const Route = createFileRoute("/_dashboard/admin")({
  component: AdminPage,
});

function UsersTab() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.users.listUsers,
    {},
    { initialNumItems: 20 }
  );

  const updateUserRole = useMutation(api.users.updateUserRole);
  const removeUser = useMutation(api.users.removeUser);

  const [removeUserId, setRemoveUserId] = useState<Id<"users"> | null>(null);

  const handleRoleChange = async (userId: Id<"users">, role: "admin" | "member") => {
    await updateUserRole({ userId, role });
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
                    variant={user.role === "owner" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>

                  {user.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.role === "member" && (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user._id, "admin")}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                        )}
                        {user.role === "admin" && (
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user._id, "member")}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setRemoveUserId(user._id)}
                          className="text-red-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
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
    api.users.listWaitlist,
    {},
    { initialNumItems: 20 }
  );

  const approveFromWaitlist = useMutation(api.users.approveFromWaitlist);
  const removeFromWaitlist = useMutation(api.users.removeFromWaitlist);

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

function TeamsTab() {
  const [createOpen, setCreateOpen] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.teams.listTeams,
    {},
    { initialNumItems: 12 }
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No teams yet</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => loadMore(12)}>
            Load More
          </Button>
        </div>
      )}

      <TeamForm open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function SettingsTab() {
  const settings = useQuery(api.settings.getAllSettings);
  const setWaitlistEnabled = useMutation(api.settings.setWaitlistEnabled);

  if (settings === undefined) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-4">
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
  const { user, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && user.role !== "owner" && user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (user.role !== "owner" && user.role !== "admin") {
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

        <TabsContent value="teams">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
