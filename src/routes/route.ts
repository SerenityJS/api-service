import type { Request, Response } from "express";

abstract class Route {
  /**
   * The path for this route (e.g., "/plugins").
  */
  public static readonly path: string = "/";

  /**
   * The HTTP method for this route (e.g., "GET", "POST").
  */
  public static readonly method: "GET" | "POST" | "PUT" | "DELETE";

  /**
   * Handle an incoming HTTP request.
   * @param req The incoming request object. 
   * @param res The outgoing response object.
   */
  public static async handle(_req: Request, _res: Response): Promise<void> {
    _res.status(501).send("Route::handle - Not Implemented");
  }
}

export { Route };
