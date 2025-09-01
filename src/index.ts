import { Database } from "bun:sqlite";
import { Server } from "node:http";

import express, { type Express } from "express";

import { Routes } from "./routes";
import { Services, type Service } from "./services";
import type { StoredPlugin } from "./types";
import type { Plugin } from "./plugin";

class RestAPIService {
  /**
   * The Express application instance
  */
  private readonly express: Express = express();

  /**
   * The HTTP server instance
  */
  private readonly server: Server = this.express.listen(4000);

  /**
   * The map of service instances
  */
  private readonly services = new Map<string, Service>();

  /**
   * The SQLite database instance
  */
  private readonly db: Database = new Database("plugins.db");

  /**
   * The in-memory cache of plugins
  */
  private readonly plugins = new Map<number, Plugin>();

  public constructor() {
    // Enable JSON body parsing middleware
    this.express.use(express.json());

    // Iterate over each route and register it with the Express app
    for (const route of Routes) {
      // Switch on the HTTP method and register the route accordingly
      switch(route.method as string) {
        default:
        case "GET": {
          this.express.get(route.path, route.handle);

          continue;
        }

        case "POST": {
          this.express.post(route.path, route.handle);

          continue;
        }
      }
    }

    // Iterate over each service and create an instance
    for (const service of Services) {
      // Create an instance of the service
      const instance = new service(this);

      // Store the service instance in the map
      this.services.set(instance.name, instance);
    }

    // Prepare the database
    this.prepareDatabase();
  }

  public getService<T extends Service>(name: string): T | null {
    // Get the service instance from the map
    const service = this.services.get(name) as T | undefined;

    // Return the service instance or null if not found
    return service ?? null;
  }

  private prepareDatabase(): void {
    // Create a table to store aproved plugins
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        approved BOOLEAN DEFAULT 0,
        name TEXT NOT NULL,
        owner TEXT NOT NULL,
        url TEXT NOT NULL
      );`).run();
  }

  public hasPlugin(id: number): boolean {
    // Check if a plugin with the given id exists in the database
    const row = this.db.prepare<boolean, any>("SELECT id FROM plugins WHERE id = ?").get(id);

    // Return true if the plugin exists, false otherwise
    return !!row;
  }

  public addStoredPlugin(plugin: StoredPlugin): void {
    // Insert a new plugin into the database
    this.db.prepare("INSERT INTO plugins (id, name, owner, url, approved) VALUES (?, ?, ?, ?, ?)")
      .run(plugin.id, plugin.name, JSON.stringify(plugin.owner), plugin.url, plugin.approved);
  }

  public getStoredPlugin(id: number): StoredPlugin | null {
    // Get a plugin with the given id from the database
    const row = this.db.prepare<any, any>("SELECT * FROM plugins WHERE id = ?").get(id);

    // Return the plugin or null if not found
    return row ? {
      id: row.id,
      name: row.name,
      owner: JSON.parse(row.owner),
      url: row.url,
      approved: row.approved === 1,
    } : null;
  }

  public updateStoredPlugin(id: number, plugin: Partial<StoredPlugin>): void {
    // Prepare a field list and values for the update query
    const fields = [];
    const values = [];

    // Iterate over the plugin properties and prepare the fields and values
    for (const [key, value] of Object.entries(plugin)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    // Add the id to the values array for the WHERE clause
    values.push(id);

    // Update the plugin in the database
    this.db.prepare(`UPDATE plugins SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  public addCachedPlugin(plugin: Plugin): void {
    // Add a plugin to the in-memory cache
    this.plugins.set(plugin.id, plugin);
  }

  public clearPluginCache(): void {
    // Clear the in-memory cache of plugins
    this.plugins.clear();
  }

  public isPluginApproved(id: number): boolean {
    // Check if a plugin with the given id is approved in the database
    const row = this.db.prepare<any, any>("SELECT approved FROM plugins WHERE id = ?").get(id);

    // Return true if the plugin is approved, false otherwise
    return row?.approved === 1;
  }

  public setPluginApproval(id: number, approved: boolean): void {
    // Update the approval status of a plugin in the database
    this.db.prepare("UPDATE plugins SET approved = ? WHERE id = ?").run(approved ? 1 : 0, id);
  }

  public getPluginFromCache(id: number): Plugin | null {
    // Get the plugin from the in-memory cache
    const plugin = this.plugins.get(id);

    // Return the plugin or null if not found
    return plugin ?? null;
  }

  public getAllPluginsFromCache(): Array<Plugin> {
    // Return all plugins from the in-memory cache as an array
    return Array.from(this.plugins.values());
  }
}

export default new RestAPIService();
export { RestAPIService };
