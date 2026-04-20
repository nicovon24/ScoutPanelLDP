export interface JwtUser {
  id: number;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}
