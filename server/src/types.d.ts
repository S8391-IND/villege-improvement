import { type User } from "@village-connect/database";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
