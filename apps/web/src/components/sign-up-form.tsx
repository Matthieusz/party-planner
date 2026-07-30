import { Button } from "@party-planner/ui/components/button";
import { FieldGroup } from "@party-planner/ui/components/field";
import { Schema } from "effect";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { useAuthForm } from "@/lib/auth-form";
import { SignUpFormValues } from "@/lib/auth-form-schema";

import Loader from "./loader";

interface SignUpFormProps {
  readonly onAuthenticated: () => Promise<void>;
  readonly onSwitchToSignIn: () => void;
}

const signUpValidator = Schema.toStandardSchemaV1(SignUpFormValues);

export default function SignUpForm({
  onAuthenticated,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const { isPending } = authClient.useSession();

  const form = useAuthForm({
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
          onSuccess: async () => {
            toast.success("Account created");
            await onAuthenticated();
          },
        }
      );
    },
    validators: {
      onSubmit: signUpValidator,
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
        onSubmit={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <form.AppForm>
          <FieldGroup className="gap-5">
            <form.AppField name="name">
              {(field) => (
                <field.AuthTextField
                  autoComplete="name"
                  label="Name"
                  placeholder="Alex Rivera"
                />
              )}
            </form.AppField>

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
                  autoComplete="new-password"
                  label="Password"
                  placeholder="8+ characters"
                  type="password"
                />
              )}
            </form.AppField>
          </FieldGroup>

          <form.AuthSubmitButton
            idleLabel="Create account"
            pendingLabel="Creating account…"
          />
        </form.AppForm>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Button
          className="h-auto p-0 font-medium"
          onClick={onSwitchToSignIn}
          type="button"
          variant="link"
        >
          Sign in
        </Button>
      </p>
    </div>
  );
}
