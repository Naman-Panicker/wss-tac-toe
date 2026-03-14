import { userInfo } from "node:os";
import z from "zod";

export const UserSchema = z.object({
    username: z.string,
    password: z.string,
    email: z.email
})