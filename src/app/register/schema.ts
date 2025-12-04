import * as yup from "yup";
import {
  validatePassword,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-validation";

export const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    )
    .test(
      "password-strength",
      "Password does not meet complexity requirements",
      function (value) {
        if (!value) return false;
        const { isValid, failedRequirements } = validatePassword(value);
        if (!isValid) {
          return this.createError({
            message: `Password must have: ${failedRequirements.join(", ").toLowerCase()}`,
          });
        }
        return true;
      }
    ),
});

export type RegisterFormInputs = yup.InferType<typeof schema>;
