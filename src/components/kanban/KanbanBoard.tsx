import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Users,
  User,
  GripVertical,
  ChevronRight,
} from "lucide-react";

type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

type Task = {
  _id: Id<"tasks">;
  name: string;
  description?: string;
  status: TaskStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assignees: Array<{
    assignmentId: Id<"taskAssignments">;
    type: "team" | "user";
    name: string;
  }>;
};

type Column = {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
};

const columns: Column[] = [
  { id: "backlog", title: "Backlog", color: "text-slate-500", bgColor: "bg-slate-500/10" },
  { id: "todo", title: "To Do", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "in_progress", title: "In Progress", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  { id: "review", title: "Review", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "done", title: "Done", color: "text-green-500", bgColor: "bg-green-500/10" },
];

const priorityColors = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

function TaskCard({
  task,
  onStatusChange,
  onDelete,
  canEdit,
}: {
  task: Task;
  onStatusChange: (taskId: Id<"tasks">, status: TaskStatus) => void;
  onDelete: (taskId: Id<"tasks">) => void;
  canEdit: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("currentStatus", task.status);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {canEdit && (
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight">{task.name}</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {columns
                    .filter((col) => col.id !== task.status)
                    .map((col) => (
                      <DropdownMenuItem
                        key={col.id}
                        onClick={() => onStatusChange(task._id, col.id)}
                      >
                        <ChevronRight className="h-3 w-3 mr-2" />
                        Move to {col.title}
                      </DropdownMenuItem>
                    ))}
                  {canEdit && (
                    <DropdownMenuItem
                      onClick={() => onDelete(task._id)}
                      className="text-red-500"
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.priority && (
                <div
                  className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`}
                  title={task.priority}
                />
              )}
              
              {task.assignees.slice(0, 2).map((a) => (
                <Badge
                  key={a.assignmentId}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {a.type === "team" ? (
                    <Users className="h-2 w-2 mr-0.5" />
                  ) : (
                    <User className="h-2 w-2 mr-0.5" />
                  )}
                  {a.name.split(" ")[0]}
                </Badge>
              ))}
              {task.assignees.length > 2 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{task.assignees.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({
  column,
  tasks,
  onStatusChange,
  onDelete,
  canEdit,
}: {
  column: Column;
  tasks: Task[];
  onStatusChange: (taskId: Id<"tasks">, status: TaskStatus) => void;
  onDelete: (taskId: Id<"tasks">) => void;
  canEdit: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId") as Id<"tasks">;
    const currentStatus = e.dataTransfer.getData("currentStatus") as TaskStatus;
    if (currentStatus !== column.id) {
      onStatusChange(taskId, column.id);
    }
  };

  return (
    <div
      className={`flex flex-col w-72 shrink-0 rounded-lg transition-all ${
        isDragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`p-3 rounded-t-lg ${column.bgColor}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${column.color}`}>
            {column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2 bg-muted/30 rounded-b-lg min-h-[200px] max-h-[60vh]">
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              canEdit={canEdit}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  canEdit,
}: {
  tasks: Task[];
  canEdit: boolean;
}) {
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const handleStatusChange = async (taskId: Id<"tasks">, status: TaskStatus) => {
    await updateTaskStatus({ taskId, status });
  };

  const handleDelete = async (taskId: Id<"tasks">) => {
    await deleteTask({ taskId });
  };

  const tasksByStatus = columns.reduce(
    (acc, col) => {
      acc[col.id] = tasks.filter((t) => t.status === col.id);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            canEdit={canEdit}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
