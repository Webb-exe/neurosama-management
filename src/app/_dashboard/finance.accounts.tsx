import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Pencil, Plus, SlidersHorizontal, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthContext } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCents } from "@/components/finance/money";
import {
  AccountFormDialog,
  type AccountFormValues,
} from "@/components/finance/AccountFormDialog";
import { FundingRowDialog } from "@/components/finance/FundingRowDialog";

export const Route = createFileRoute("/_dashboard/finance/accounts")({
  component: FinanceAccountsPage,
});

const TYPE_LABEL: Record<string, string> = {
  team: "Team",
  grant: "Grant",
  member: "Member",
  sponsor: "Sponsor",
  other: "Other",
};

function FinanceAccountsPage() {
  const { hasPermission } = useAuthContext();
  const canView = hasPermission(PERMISSIONS.financeAccountsView);
  const canManageAccounts = hasPermission(PERMISSIONS.financeAccountsManage);
  const canManageFunding = hasPermission(
    PERMISSIONS.financeAccountsFundingManage,
  );

  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"financeAccounts"> | null>(
    null,
  );
  const [accountDialog, setAccountDialog] = useState<{
    open: boolean;
    initial: AccountFormValues | null;
  }>({ open: false, initial: null });
  const [fundingDialog, setFundingDialog] = useState<{
    open: boolean;
    accountId: Id<"financeAccounts"> | null;
    accountName: string;
  }>({ open: false, accountId: null, accountName: "" });

  const accounts = useQuery(
    api.inventory.accounts.listAccounts,
    canView ? { includeInactive, limit: 200 } : "skip",
  );

  const selectedAccount = accounts?.find(
    (account) => account._id === selectedId,
  );

  const fundingRows = useQuery(
    api.inventory.accounts.listFundingRows,
    selectedId ? { accountId: selectedId, limit: 100 } : "skip",
  );

  if (!canView) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don't have permission to view finance accounts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIncludeInactive((prev) => !prev)}
          className={cn(includeInactive && "border-primary text-primary")}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          {includeInactive ? "Showing inactive" : "Active only"}
        </Button>
        {canManageAccounts && (
          <Button
            size="sm"
            onClick={() =>
              setAccountDialog({ open: true, initial: null })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New account
          </Button>
        )}
      </div>

      <Card className="rounded-xl border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked user</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts === undefined ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="mx-auto h-5 w-32" />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No accounts yet.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => {
                  const isSelected = account._id === selectedId;
                  return (
                    <TableRow
                      key={account._id}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(account._id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{account.name}</span>
                          {!account.active && (
                            <Badge variant="outline" className="text-[10px]">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        {account.description && (
                          <p className="text-xs text-muted-foreground">
                            {account.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABEL[account.type] ?? account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.linkedUserName ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          account.balanceCents < 0 && "text-destructive",
                        )}
                      >
                        {formatCents(account.balanceCents)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {canManageFunding && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setFundingDialog({
                                  open: true,
                                  accountId: account._id,
                                  accountName: account.name,
                                })
                              }
                            >
                              Add funding
                            </Button>
                          )}
                          {canManageAccounts && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                setAccountDialog({
                                  open: true,
                                  initial: {
                                    _id: account._id,
                                    name: account.name,
                                    type: account.type,
                                    linkedUserId: account.linkedUserId,
                                    description: account.description,
                                    active: account.active,
                                  },
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card className="rounded-xl border-border/60">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  {selectedAccount.name} — funding history
                </h3>
                <p className="text-xs text-muted-foreground">
                  Calculated balance: {formatCents(selectedAccount.balanceCents)}
                </p>
              </div>
              {canManageFunding && (
                <Button
                  size="sm"
                  onClick={() =>
                    setFundingDialog({
                      open: true,
                      accountId: selectedAccount._id,
                      accountName: selectedAccount.name,
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add funding
                </Button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundingRows === undefined ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Skeleton className="mx-auto h-5 w-32" />
                      </TableCell>
                    </TableRow>
                  ) : fundingRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-muted-foreground"
                      >
                        No funding rows yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fundingRows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell className="font-medium">
                          {row.source}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(row.fundedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCents(row.amountCents)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AccountFormDialog
        open={accountDialog.open}
        onOpenChange={(open) =>
          setAccountDialog((prev) => ({ ...prev, open }))
        }
        initial={accountDialog.initial}
      />
      {fundingDialog.accountId && (
        <FundingRowDialog
          open={fundingDialog.open}
          onOpenChange={(open) =>
            setFundingDialog((prev) => ({ ...prev, open }))
          }
          accountId={fundingDialog.accountId}
          accountName={fundingDialog.accountName}
        />
      )}
    </div>
  );
}
