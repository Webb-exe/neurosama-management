import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
  Plus,
  User,
  Palette,
  Code,
  Wrench,
  Heart,
  Briefcase,
  Users,
  Target,
  TestTube,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { FormattedDate } from "@/components/ui/timezone-date-input";
import { useTimezone } from "@/context/TimezoneContext";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_dashboard/notebook")({
  component: NotebookPage,
});

const categories = [
  { value: "design", label: "Design", icon: Palette, color: "bg-purple-500" },
  { value: "build", label: "Build", icon: Wrench, color: "bg-orange-500" },
  { value: "code", label: "Code", icon: Code, color: "bg-blue-500" },
  { value: "outreach", label: "Outreach", icon: Heart, color: "bg-pink-500" },
  { value: "business", label: "Business", icon: Briefcase, color: "bg-green-500" },
  { value: "team", label: "Team", icon: Users, color: "bg-cyan-500" },
  { value: "strategy", label: "Strategy", icon: Target, color: "bg-yellow-500" },
  { value: "testing", label: "Testing", icon: TestTube, color: "bg-red-500" },
];

function EntryCard({ entry }: {
  entry: {
    _id: string;
    title: string;
    content: string;
    category: string;
    entryDate: number;
    authorName: string;
    tags?: string[];
  };
}) {
  const categoryInfo = categories.find((c) => c.value === entry.category);
  const Icon = categoryInfo?.icon || BookOpen;

  // Get first ~200 chars of content for preview
  const preview = entry.content.replace(/<[^>]*>/g, "").slice(0, 150);

  return (
    <Link to="/notebook/$id" params={{ id: entry._id }}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <Badge
              variant="outline"
              className={`${categoryInfo?.color} bg-opacity-20 border-0`}
            >
              <Icon className="h-3 w-3 mr-1" />
              {categoryInfo?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              <FormattedDate timestamp={entry.entryDate} format="date" />
            </span>
          </div>
          <CardTitle className="text-lg mt-2">{entry.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {preview}...
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {entry.authorName}
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-1">
                {entry.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function NotebookPage() {
  const { dateToUtcTimestamp } = useTimezone();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "build" as const,
    tags: "",
  });

  const { results, status, loadMore } = usePaginatedQuery(
    api.notebook.listEntries,
    { category: categoryFilter as "design" | "build" | "code" | "outreach" | "business" | "team" | "strategy" | "testing" | undefined },
    { initialNumItems: 12 }
  );

  const stats = useQuery(api.notebook.getNotebookStats);
  const createEntry = useMutation(api.notebook.createEntry);

  const handleCreate = async () => {
    if (!formData.title || !formData.content || !entryDate) return;

    await createEntry({
      title: formData.title,
      content: formData.content,
      category: formData.category,
      entryDate: dateToUtcTimestamp(entryDate),
      contributors: [],
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : undefined,
    });

    setFormData({
      title: "",
      content: "",
      category: "build",
      tags: "",
    });
    setEntryDate(new Date());
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Engineering Notebook
          </h1>
          <p className="text-muted-foreground">
            Document your team&apos;s engineering journey
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-1">
                {categories.slice(0, 4).map((cat) => (
                  <Badge
                    key={cat.value}
                    variant="outline"
                    className="text-xs"
                  >
                    {stats.byCategory[cat.value as keyof typeof stats.byCategory]}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">By Category</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setCategoryFilter(undefined)}
        >
          All
        </Button>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.value}
              variant={categoryFilter === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat.value)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      {/* Entry Grid */}
      {status === "LoadingFirstPage" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No entries found</h3>
            <p className="text-muted-foreground mb-4">
              {categoryFilter
                ? `No entries in the ${categories.find((c) => c.value === categoryFilter)?.label} category`
                : "Start documenting your engineering journey"}
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((entry) => (
              <EntryCard key={entry._id} entry={entry} />
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => loadMore(12)}>
                Load More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>New Notebook Entry</DialogTitle>
            <DialogDescription>
              Document your team&apos;s progress, designs, and learnings.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Date</Label>
                  <DatePicker
                    value={entryDate}
                    onChange={setEntryDate}
                    placeholder="Select date"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as typeof formData.category })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Drivetrain Design Review"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Document your work, decisions, and learnings..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., drivetrain, mecanum, prototype"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.title || !formData.content}
            >
              Create Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
