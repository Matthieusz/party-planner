import { Button } from "@party-planner/ui/components/button";
import { FieldGroup } from "@party-planner/ui/components/field";
import { Schema } from "effect";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useAuthForm } from "@/lib/auth-form";
import { SignInFormValues } from "@/lib/auth-form-schema";

import Loader from "./loader";

interface SignInFormProps {
  readonly onAuthenticated: () => Promise<void>;
  readonly onSwitchToSignUp: () => void;
}

const signInValidator = Schema.toStandardSchemaV1(SignInFormValues);

export default function SignInForm({
  onAuthenticated,
  onSwitchToSignUp,
}: SignInFormProps) {
  const { isPending } = authClient.useSession();

  const form = useAuthForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
          onSuccess: async () => {
            toast.success("Welcome back");
            await onAuthenticated();
          },
        }
      );
    },
    validators: {
      onSubmit: signInValidator,
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sign in to see what tonight&rsquo;s service needs from you.
        </p>
      </div>

      <form
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <form.AppForm>
          <FieldGroup className="gap-5">
            <form.AppField name="email">
              {(field) => (
                <field.AuthTextField
                  autoComplete="email"
                  label="Email"
                  placeholder="you@venue.com"
                  type="email"
                />
              )}
            </form.AppField>

            <form.AppField name="password">
              {(field) => (
                <field.AuthTextField
                  autoComplete="current-password"
                  label="Password"
                  placeholder="••••••••"
                  type="password"
                />
              )}
            </form.AppField>
          </FieldGroup>

          <form.AuthSubmitButton
            idleLabel="Sign in"
            pendingLabel="Signing in…"
          />
        </form.AppForm>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Party Planner?{" "}
        <Button
          className="h-auto p-0 font-medium"
          onClick={onSwitchToSignUp}
          type="button"
          variant="link"
        >
          Create an account
        </Button>
      </p>
    </div>
  );
}
