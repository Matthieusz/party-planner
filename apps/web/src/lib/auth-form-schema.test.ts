import { Schema } from "effect";
import { expect, it } from "vitest";

import { SignInFormValues, SignUpFormValues } from "./auth-form-schema";

it("validates auth forms through the Standard Schema adapter", async () => {
  const signIn = Schema.toStandardSchemaV1(SignInFormValues);
  const signUp = Schema.toStandardSchemaV1(SignUpFormValues);

  const validResult = await signUp["~standard"].validate({
    email: "coordinator@venue.example",
    name: "Alex Rivera",
    password: "correct-horse",
  });
  const invalidResult = await signIn["~standard"].validate({
    email: "not-an-email",
    password: "short",
  });

  expect(validResult).toHaveProperty("value");
  expect(invalidResult).toHaveProperty("issues");
  if ("issues" in invalidResult) {
    expect(invalidResult.issues.map(({ message }) => message)).toEqual([
      "Enter a valid email address",
      "Password must be at least 8 characters",
    ]);
  }
});
