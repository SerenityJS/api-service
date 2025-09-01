import type { Request, Response } from "express";
import { Route } from "./route";

import RestAPIService from "../index";

class GetPluginRoute extends Route {
  public static override readonly path: string = "/plugin/{:id}";

  public static override readonly method = "GET";

  public static override async handle(req: Request, res: Response): Promise<void> {
    // Get the plugin ID from the request parameters
    const id = Number(req.params.id);

    // Get the plugin from the cache
    const plugin = RestAPIService.getPluginFromCache(id);

    // Check if the plugin was found
    if (!plugin) {
      // Send a 404 response if the plugin was not found
      res.status(404).send({ message: `Plugin with ID ${id} not found` });
    } else {
      // Send the plugin as the response
      res.status(200).send(plugin);
    }
  }
}

export { GetPluginRoute };