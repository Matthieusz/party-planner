import { Button } from "@party-planner/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@party-planner/ui/components/field";
import { Input } from "@party-planner/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          name: value.name,
          password: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
            toast.success("Account created");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Set up your venue&rsquo;s operational hub in under a minute.
        </p>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-5">
          <form.Field name="name">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors || undefined}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={hasErrors || undefined}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  <FieldError
                    id={`${field.name}-error`}
                    errors={field.state.meta.errors}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors || undefined}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder="you@venue.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={hasErrors || undefined}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  <FieldError
                    id={`${field.name}-error`}
                    errors={field.state.meta.errors}
                  />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const hasErrors = field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={hasErrors || undefined}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder="8+ characters"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={hasErrors || undefined}
                    aria-describedby={
                      hasErrors ? `${field.name}-error` : undefined
                    }
                  />
                  <FieldError
                    id={`${field.name}-error`}
                    errors={field.state.meta.errors}
                  />
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="mt-7 h-10 w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button
          type="button"
          variant="link"
          onClick={onSwitchToSignIn}
          className="h-auto p-0 font-medium"
        >
          Sign in
        </Button>
      </p>
    </div>
  );
}
