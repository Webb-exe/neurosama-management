import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type InvoiceStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "void";

export type ReimbursementStatus =
  | "not_required"
  | "pending"
  | "partial"
  | "reimbursed";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  void: "Void",
};

const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  approved:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  void: "bg-muted text-muted-foreground/70 border-border line-through",
};

const REIMB_LABEL: Record<ReimbursementStatus, string> = {
  not_required: "No reimb.",
  pending: "Reimb. pending",
  partial: "Reimb. partial",
  reimbursed: "Reimbursed",
};

const REIMB_CLASSES: Record<ReimbursementStatus, string> = {
  not_required: "bg-muted text-muted-foreground border-border",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  partial: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  reimbursed:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={cn("border", STATUS_CLASSES[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function ReimbursementStatusBadge({
  status,
}: {
  status: ReimbursementStatus;
}) {
  return (
    <Badge variant="outline" className={cn("border", REIMB_CLASSES[status])}>
      {REIMB_LABEL[status]}
    </Badge>
  );
}
