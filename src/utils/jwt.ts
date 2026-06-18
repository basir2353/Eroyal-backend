import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role, Permission } from "../types/roles.js";

export type TokenPayload = {
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
