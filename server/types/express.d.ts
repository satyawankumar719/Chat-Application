import type { Request } from "express";
import type { UserSchemaInterface } from "../models/User.js";

export interface AuthRequest extends Request {
  user?: UserSchemaInterface;
  token?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserSchemaInterface;
      token?: string;
    }
      namespace Multer {
      interface File {
        subfolder?: string;
      }
    }
  }
}