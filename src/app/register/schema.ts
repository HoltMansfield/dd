import * as yup from "yup";

export const schema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
});

export type RegisterFormInputs = yup.InferType<typeof schema>;
