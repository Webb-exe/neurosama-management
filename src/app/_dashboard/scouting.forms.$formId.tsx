import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { parseCycleSearch } from "@/components/scouting/search";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/scouting/forms/$formId")({
  validateSearch: parseCycleSearch,
  component: ScoutingFormWorkspaceLayout,
});

function ScoutingFormWorkspaceLayout() {
  const params = Route.useParams();
  const search = Route.useSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const formId = params.formId;

  const base = `/scouting/forms/${formId}`;
  const isEdit = pathname === base || pathname === `${base}/`;
  const isPreview = pathname.includes("/preview");
  const isLinks = pathname.includes("/links");

  const tabCls = (active: boolean) =>
    cn(
      "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-4">
      <nav
        className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
        aria-label="Form workspace"
      >
        <Link
          to="/scouting/forms/$formId"
          params={{ formId }}
          search={search}
          className={tabCls(isEdit)}
        >
          Edit
        </Link>
        <Link
          to="/scouting/forms/$formId/preview"
          params={{ formId }}
          search={search}
          className={tabCls(isPreview)}
        >
          Preview
        </Link>
        <Link
          to="/scouting/forms/$formId/links"
          params={{ formId }}
          search={search}
          className={tabCls(isLinks)}
        >
          Public links
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
