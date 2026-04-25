import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCents } from "@/components/finance/money";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type UploadStage = "idle" | "presigning" | "uploading" | "analyzing" | "done";

type ImportResult = {
  invoiceId: Id<"invoices">;
  fileName: string;
  supplierName: string;
  lineItemCount: number;
  createdTotalCents: number;
  structured: {
    invoiceDate: string | null;
    invoiceNumber: string | null;
    totalCents: number;
    warnings: string[];
    lineItems: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      lineTotalCents: number;
    }>;
  };
};

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "Choose a PDF or image invoice to import.",
  presigning: "Preparing a secure upload URL...",
  uploading: "Uploading invoice to S3...",
  analyzing: "Reading invoice and creating the draft...",
  done: "Invoice draft created.",
};

export function InvoiceUploadDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const createUploadUrl = useAction(
    api.inventory.invoiceUpload.createInvoiceUploadUrl,
  );
  const importUploadedInvoice = useAction(
    api.inventory.invoiceUpload.importUploadedInvoice,
  );

  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const busy =
    stage === "presigning" || stage === "uploading" || stage === "analyzing";

  useEffect(() => {
    if (open) {
      setFile(null);
      setStage("idle");
      setError(null);
      setResult(null);
    }
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || busy) return;

    setError(null);
    setResult(null);

    try {
      setStage("presigning");
      const upload = await createUploadUrl({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        byteSize: file.size,
      });

      setStage("uploading");
      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": upload.contentType,
        },
        body: file,
      });
      if (!response.ok) {
        throw new Error(
          `S3 upload failed with ${response.status} ${response.statusText}`,
        );
      }

      setStage("analyzing");
      const imported = await importUploadedInvoice({
        objectKey: upload.objectKey,
        fileName: file.name,
        contentType: upload.contentType,
        byteSize: file.size,
      });
      setResult(imported);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStage("idle");
    }
  };

  const openInvoice = () => {
    if (!result) return;
    onOpenChange(false);
    navigate({
      to: "/finance/invoices/$invoiceId",
      params: { invoiceId: String(result.invoiceId) },
    });
  };

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload invoice</DialogTitle>
          <DialogDescription>
            Upload a PDF or image. AI will resolve suppliers and inventory items,
            then create a draft invoice.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <div className="font-medium">{result.supplierName}</div>
              <div className="text-muted-foreground">
                {result.structured.invoiceNumber
                  ? `Invoice ${result.structured.invoiceNumber}`
                  : "No invoice number found"}
                {result.structured.invoiceDate
                  ? ` · ${result.structured.invoiceDate}`
                  : ""}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Line items</div>
                  <div className="font-medium">{result.lineItemCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">
                    {formatCents(result.createdTotalCents)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Structured output</div>
              <div className="max-h-40 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                {result.structured.lineItems.slice(0, 5).map((line, index) => (
                  <div key={`${line.itemName}-${index}`} className="py-1">
                    {line.quantity} {line.unit} · {line.itemName} ·{" "}
                    {formatCents(line.lineTotalCents)}
                  </div>
                ))}
                {result.structured.lineItems.length > 5 && (
                  <div className="py-1 text-muted-foreground">
                    +{result.structured.lineItems.length - 5} more line items
                  </div>
                )}
              </div>
            </div>

            {result.structured.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
                {result.structured.warnings.join(" ")}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invoice-upload-file">
                  Invoice file
                </FieldLabel>
                <Input
                  id="invoice-upload-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(event) =>
                    setFile(event.target.files?.item(0) ?? null)
                  }
                />
                <FieldDescription>
                  Files must be PDF, JPEG, PNG, or WebP and 10 MB or smaller.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <p className="text-sm text-muted-foreground">{STAGE_LABELS[stage]}</p>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!file || busy}>
                {busy ? "Importing..." : "Upload and import"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {result && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFile(null);
                setResult(null);
                setStage("idle");
              }}
            >
              Import another
            </Button>
            <Button type="button" onClick={openInvoice}>
              Open invoice
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
