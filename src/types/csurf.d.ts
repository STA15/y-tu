declare module 'csurf' {
  import { RequestHandler } from 'express';

  interface CsrfOptions {
    value?: (req: any) => string;
    cookie?: boolean | {
      key?: string;
      path?: string;
      signed?: boolean;
      secure?: boolean;
      maxAge?: number;
      httpOnly?: boolean;
      sameSite?: boolean | 'lax' | 'strict' | 'none';
      domain?: string;
    };
    ignoreMethods?: string[];
    sessionKey?: string;
  }

  function csurf(options?: CsrfOptions): RequestHandler;

  export = csurf;
}