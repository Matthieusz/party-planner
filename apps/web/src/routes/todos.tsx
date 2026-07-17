import { Button } from "@party-planner/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@party-planner/ui/components/card";
import { Checkbox } from "@party-planner/ui/components/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@party-planner/ui/components/empty";
import { Input } from "@party-planner/ui/components/input";
import { Label } from "@party-planner/ui/components/label";
import { Skeleton } from "@party-planner/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ClipboardList, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";

const TaskListSkeleton = () => (
  <ul className="space-y-2" aria-label="Loading tasks">
    {["sk-1", "sk-2", "sk-3"].map((key) => (
      <li
        key={key}
        className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
      >
        <Skeleton className="size-4 rounded-[5px]" />
        <Skeleton className="h-4 flex-1" />
      </li>
    ))}
  </ul>
);

const TodosRoute = () => {
  const [newTodoText, setNewTodoText] = useState("");

  const todos = useQuery(orpc.todo.getAll.queryOptions());
  const createMutation = useMutation(
    orpc.todo.create.mutationOptions({
      onSuccess: () => {
        todos.refetch();
        setNewTodoText("");
      },
    })
  );
  const toggleMutation = useMutation(
    orpc.todo.toggle.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    })
  );
  const deleteMutation = useMutation(
    orpc.todo.delete.mutationOptions({
      onSuccess: () => {
        todos.refetch();
      },
    })
  );

  const handleAddTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      createMutation.mutate({ text: newTodoText });
    }
  };

  const handleToggleTodo = (id: number, completed: boolean) => {
    toggleMutation.mutate({ completed: !completed, id });
  };

  const handleDeleteTodo = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const remaining = todos.data?.filter((todo) => !todo.completed).length ?? 0;

  let summary: ReactNode = "Loading the pass…";
  if (!todos.isLoading && remaining === 0) {
    summary = "Nothing left on the pass. Service is clear.";
  } else if (!todos.isLoading) {
    summary = (
      <>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {remaining}
        </span>{" "}
        {remaining === 1 ? "task" : "tasks"} to clear before service.
      </>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 lg:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tasks
        </h1>
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {summary}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tonight&rsquo;s list</CardTitle>
          <CardDescription>
            Add, check off, and clear tasks as the floor moves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTodo} className="mb-6 flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="new-task" className="sr-only">
                New task
              </Label>
              <Input
                id="new-task"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a task, e.g. Confirm vegan count with kitchen"
                disabled={createMutation.isPending}
                className="h-10"
              />
            </div>
            <Button
              type="submit"
              className="h-10"
              disabled={createMutation.isPending || !newTodoText.trim()}
            >
              {createMutation.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                "Add"
              )}
            </Button>
          </form>

          {(() => {
            if (todos.isLoading) {
              return <TaskListSkeleton />;
            }
            if (todos.data?.length === 0) {
              return (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ClipboardList aria-hidden />
                    </EmptyMedia>
                    <EmptyTitle>Nothing on the pass</EmptyTitle>
                    <EmptyDescription>
                      Tasks you add appear here and stay in sync for the whole
                      floor. Start with whatever needs doing before doors.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              );
            }
            return (
              <ul className="space-y-2">
                {todos.data?.map((todo) => (
                  <li
                    key={todo.id}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() =>
                          handleToggleTodo(todo.id, todo.completed)
                        }
                        id={`todo-${todo.id}`}
                      />
                      <label
                        htmlFor={`todo-${todo.id}`}
                        className={
                          todo.completed
                            ? "truncate text-sm text-muted-foreground line-through"
                            : "truncate text-sm"
                        }
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      aria-label={`Delete task: ${todo.text}`}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute("/todos")({
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  component: TodosRoute,
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: "/login",
      });
    }
  },
});
