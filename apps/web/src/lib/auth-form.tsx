import { Button } from "@party-planner/ui/components/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@party-planner/ui/components/field";
import { Input } from "@party-planner/ui/components/input";
import { Spinner } from "@party-planner/ui/components/spinner";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

type AuthInputType = "email" | "password" | "text";

interface AuthTextFieldProps {
  readonly autoComplete: string;
  readonly label: string;
  readonly placeholder: string;
  readonly type?: AuthInputType;
}

interface AuthSubmitButtonProps {
  readonly idleLabel: string;
  readonly pendingLabel: string;
}

const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

const AuthTextField = ({
  autoComplete,
  label,
  placeholder,
  type = "text",
}: AuthTextFieldProps) => {
  const field = useFieldContext<string>();
  const hasErrors = field.state.meta.errors.length > 0;
  const errorId = `${field.name}-error`;

  return (
    <Field data-invalid={hasErrors || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        aria-describedby={hasErrors ? errorId : undefined}
        aria-invalid={hasErrors || undefined}
        autoComplete={autoComplete}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value}
      />
      <FieldError id={errorId} errors={field.state.meta.errors} />
    </Field>
  );
};

const AuthSubmitButton = ({
  idleLabel,
  pendingLabel,
}: AuthSubmitButtonProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }) => (
        <Button
          className="mt-7 h-10 w-full"
          disabled={!canSubmit || isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Spinner data-icon="inline-start" />
              {pendingLabel}
            </>
          ) : (
            idleLabel
          )}
        </Button>
      )}
    </form.Subscribe>
  );
};

/** Auth-specific TanStack Form hook with the project's accessible field UI. */
export const { useAppForm: useAuthForm } = createFormHook({
  fieldComponents: { AuthTextField },
  fieldContext,
  formComponents: { AuthSubmitButton },
  formContext,
});
