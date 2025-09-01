import type { Request, Response } from "express";

import { Route } from "./route";
import RestAPIService from "../index";

class GetPluginsRoute extends Route {
  public static override readonly path: string = "/plugins";

  public static override readonly method = "GET";

  public static override async handle(_req: Request, res: Response): Promise<void> {
    // Get all plugins from the cache
    const plugins = RestAPIService.getAllPluginsFromCache();

    // Send the plugins as the response
    res.status(200).send(plugins);
  }
}

export { GetPluginsRoute };