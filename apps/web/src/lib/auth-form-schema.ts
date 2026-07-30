import { Schema } from "effect";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const Email = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(EMAIL_PATTERN, {
      message: "Enter a valid email address",
    })
  )
);

const Name = Schema.String.pipe(
  Schema.check(
    Schema.isMinLength(2, {
      message: "Name must be at least 2 characters",
    })
  )
);

const Password = Schema.String.pipe(
  Schema.check(
    Schema.isMinLength(8, {
      message: "Password must be at least 8 characters",
    })
  )
);

/** Effect Schema validator used by the existing sign-in form. */
export const SignInFormValues = Schema.Struct({
  email: Email,
  password: Password,
});

/** Effect Schema validator used by the existing sign-up form. */
export const SignUpFormValues = Schema.Struct({
  email: Email,
  name: Name,
  password: Password,
});
