import axios from "axios";

import type { RestAPIService } from "../index";

import { Service } from "./service";
import type { PluginContributor, PluginRelease, RepositoryContributor, RepositoryQuery, RepositoryRelease, StoredPlugin } from "../types";
import type { Discord } from "./discord";
import { Plugin } from "../plugin";

// This service will handle fetching plugins from GitHub

class GHFetch extends Service {
  /**
   * The GitHub API endpoint for searching repositories
  */
  private readonly endpoint = "https://api.github.com/search/repositories";

  /**
   * The query to search for Serenity/JS plugins
  */
  private readonly query = "topic:serenityjs-plugin";

  /**
   * The time interval (in milliseconds) to refresh the plugin list from GitHub (default: 5 minutes)
  */
  private refreshTime = 5 * 60 * 1000;

  /**
   * The time interval (in milliseconds) to clear the plugin cache (default: 1 hour)
  */
  private cacheClearTime = 60 * 60 * 1000;

  public constructor(api: RestAPIService) {
    super(api);

    // Fetch the plugins immediately
    this.fetchPlugins();

    // Set an interval to fetch the plugins periodically
    setInterval(() => this.fetchPlugins(), this.refreshTime);

    // Set an interval to clear the plugin cache periodically
    setInterval(() => {this.api.clearPluginCache(); this.fetchPlugins()}, this.cacheClearTime);
  }

  public async fetchPlugins(): Promise<any> {
    try {
      // Get the list of repositories from the GitHub API
      const response = await axios.get<RepositoryQuery>(this.endpoint, {
        params: {
          q: this.query,
        },
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      // Iterate over the repositories and log their names
      for (const repo of response.data.items) {
        // Check if the plugin is already in the database
        if (this.api.hasPlugin(repo.id)) {
          // Verify if the plugin is approved or if the plugin id already exists in the cache
          if (!this.api.isPluginApproved(repo.id) || this.api.getPluginFromCache(repo.id)) continue;

          // Fetch the stored plugin data from the database
          const stored = this.api.getStoredPlugin(repo.id) as StoredPlugin;

          // Create a Plugin instance from the stored data and repository data
          const plugin = await Plugin.create(stored, repo);

          this.api.addCachedPlugin(plugin);

          console.log(`Plugin: ${repo.name} (${repo.id}) by ${repo.owner.login} - ${repo.url}`);

        } else {
          // Create a StoredPlugin object
          const storage: StoredPlugin = {
            id: repo.id,
            name: repo.name,
            owner: {
              username: repo.owner.login,
              profile_url: repo.owner.html_url,
              avatar_url: repo.owner.avatar_url,
              contributions: 0,
            },
            branch: repo.default_branch,
            url: repo.html_url,
            approved: false,
          };

          // Check if the plugin has releases, if not, skip it
          if ((await Plugin.getReleases(storage)).length === 0) {
            // Log that the plugin has no releases
            console.log(`Plugin: ${repo.name} by ${repo.owner.login} has no releases, skipping...`);

            // Continue to the next repository
            continue;
          }

          // If not, add it to the database
          this.api.addStoredPlugin(storage);

          // Get the Discord service instance
          const discord = this.api.getService<Discord>("Discord");

          // Send a message to the Discord channel for plugin approval
          if (discord) discord.sendPluginApprovalRequest(storage)
        }
      }

    } catch (error) {}
  }
}

export { GHFetch };
