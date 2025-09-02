import axios from "axios";

import type { PluginContributor, PluginRelease, Repository, RepositoryContributor, RepositoryRelease, StoredPlugin } from "./types";

class Plugin implements StoredPlugin {
  /**
   * The unique identifier of the plugin (GitHub repository ID)
  */
  public readonly id: number;

  /**
   * The name of the plugin (GitHub repository name)
  */
  public readonly name: string;

  /**
   * The owner of the plugin (GitHub repository owner)
  */
  public readonly owner: PluginContributor;

  /**
   * The URL of the plugin (GitHub repository URL)
  */
  public readonly url: string;

  /**
   * The default branch of the plugin repository (assumed to be "main")
  */
  public readonly branch: string = "main";

  /**
   * Whether the plugin has been approved for listing
  */
  public readonly approved: boolean;

  public description: string | null = null;

  public version: string | null = null;

  public stars: number | null = null;

  public downloads: number | null = null;

  public keywords: Array<string> | null = null;

  public logo: string | null = null;

  public banner: string | null = null;

  public published: string | null = null;

  public updated: string | null = null;

  public readme: string | null = null;

  public gallery: Array<string> = [];

  public contributors: Array<PluginContributor> = [];

  public releases: Array<PluginRelease> = [];

  /**
   * Creates an instance of the Plugin.
   * @param data The stored plugin data.
   */
  private constructor(data: StoredPlugin, repository: Repository) {
    // Load the basic data from the stored plugin object
    this.id = data.id;
    this.name = data.name;
    this.owner = data.owner;
    this.url = data.url;
    this.branch = repository.default_branch;
    this.approved = data.approved;

    // Load additional data from the repository object
    this.description = repository.description;
    this.stars = repository.stargazers_count;
    this.published = repository.created_at;
    this.updated = repository.updated_at;
  }

  public static async create(data: StoredPlugin, repository: Repository): Promise<Plugin> {
    // Create a new Plugin instance
    const plugin = new Plugin(data, repository);

    // Fetch the logo URL
    plugin.logo = await this.getLogoURL(data);

    // Fetch the banner URL
    plugin.banner = await this.getBannerURL(data);

    // Fetch the releases & map the total downloads
    plugin.releases = await this.getReleases(data);
    plugin.downloads = plugin.releases.reduce((acc, release) => acc + release.assets.reduce((a, asset) => a + asset.download_count, 0), 0);

    // Fetch the contributors
    plugin.contributors = await this.getContributors(data);

    // Fetch the gallery images
    plugin.gallery = await plugin.getGallery();

    // Fetch the readme
    plugin.readme = await this.getReadme(data);

    // Fetch the package.json to get the version and keywords
    const packageData = await this.getPackageJSON(data);
    if (packageData) {
      plugin.version = packageData.version;
      plugin.keywords = packageData.keywords;
    }

    // Return the plugin instance
    return plugin;
  }

  public static async getReleases(plugin: StoredPlugin): Promise<Array<PluginRelease>> {
    try {
      // Check if the plugin has any releases on GitHub
      const response = await axios.get<Array<RepositoryRelease>>(`https://api.github.com/repos/${plugin.owner.username}/${plugin.name}/releases`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}` },
      });

      // Return the releases if the request was successful
      return response.data.map(release => ({
        name: release.name || release.tag_name,
        tag: release.tag_name,
        url: release.html_url,
        description: release.body ?? "",
        prerelease: release.prerelease,
        assets: release.assets.map((asset) => ({
          name: asset.name,
          size: asset.size,
          download_url: asset.browser_download_url,
          download_count: asset.download_count,
        })),
      }));
    } catch {
      // Return an empty array if the request failed
      return [];
    }
  }

  public static async getContributors(plugin: StoredPlugin): Promise<Array<PluginContributor>> {
    try {
      // Check if the plugin has any contributors on GitHub
      const response = await axios.get<Array<RepositoryContributor>>(`https://api.github.com/repos/${plugin.owner.username}/${plugin.name}/contributors`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}` },
      });

      // Return the contributors if the request was successful
      return response.data.map(contributor => ({
        username: contributor.login,
        profile_url: contributor.html_url,
        avatar_url: contributor.avatar_url,
        contributions: contributor.contributions,
      }));
    } catch {
      // Return an empty array if the request failed
      return [];
    }
  }

  public static async getLogoURL(plugin: StoredPlugin): Promise<string> {
    // The logo URL is assumed to be at a standard location in the repository
    const url = `https://raw.githubusercontent.com/${plugin.owner.username}/${plugin.name}/${plugin.branch}/public/logo.png`;

    try {
      // Check if the logo exists by making a HEAD request
      const response = await axios.head(url);

      // Return the logo URL if it exists, otherwise return a default logo
      return response.status === 200 ? url : "https://avatars.githubusercontent.com/u/92610726?s=88&v=4";
    } catch {
      return "https://avatars.githubusercontent.com/u/92610726?s=88&v=4";
    }
  }

  public static async getBannerURL(plugin: StoredPlugin): Promise<string | null> {
    // The banner URL is assumed to be at a standard location in the repository
    const url = `https://raw.githubusercontent.com/${plugin.owner.username}/${plugin.name}/${plugin.branch}/public/banner.png`;

    try {
      // Check if the banner exists by making a HEAD request
      const response = await axios.head(url);

      // Return the banner URL if it exists, otherwise return null
      return response.status === 200 ? url : null;
    } catch {
      return null;
    }
  }

  public static async getReadme(plugin: StoredPlugin): Promise<string | null> {
    try {
      // Get the readme file from the repository
      const response = await axios.get<string>(`https://raw.githubusercontent.com/${plugin.owner.username}/${plugin.name}/${plugin.branch}/README.md`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}` },
      });

      // Return the readme content
      return response.data;
    } catch {
      // Return null if the request failed
      return null;
    }
  }

  public static async getPackageJSON(plugin: StoredPlugin): Promise<{ version: string, keywords: Array<string> } | null> {
    try {
      // Get the package.json file from the repository
      const response = await axios.get<{ version: string, keywords: Array<string> }>(`https://raw.githubusercontent.com/${plugin.owner.username}/${plugin.name}/${plugin.branch}/package.json`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}` },
      });

      // Return the package.json content
      return response.data;
    } catch {
      console.log("Failed to fetch package.json");

      // Return null if the request failed
      return null;
    }
  }

  public async getGallery(): Promise<Array<string>> {
    // The gallery images are assumed to be in a standard location in the repository
    // Assumed path ./public/gallery/*.png
    const images = [];

    // Fetch all images in the gallery (up to 10 images)
    for (let i = 1; i <= 10; i++) {
      try {
        // Construct the image URL
        const url = `https://raw.githubusercontent.com/${this.owner.username}/${this.name}/${this.branch}/public/gallery/image${i}.png`;

        // Check if the image exists by making a HEAD request
        const response = await axios.head(url);

        // If the image exists, add it to the gallery
        if (response.status === 200) {
          images.push(url);
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    // Return the gallery images
    return images;
  }

  public static async getRepository(plugin: StoredPlugin): Promise<Repository | null> {
    try {
      // Get the repository details from GitHub
      const response = await axios.get<Repository>(`https://api.github.com/repositories/${plugin.id}`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}` },
      });

      // Return the repository details
      return response.data;
    } catch {
      // Return null if the request failed
      return null;
    }
  }
}

export { Plugin };