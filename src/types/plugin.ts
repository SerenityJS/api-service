import type { StoredPlugin } from "./stored-plugin";

interface PluginRelease {
  name: string;
  tag: string;
  url: string;
  description: string;
  prerelease: boolean;
  assets: Array<PluginReleaseAsset>;
}

interface PluginReleaseAsset {
  name: string;
  size: number;
  download_url: string;
  download_count: number;
}

interface PluginContributor {
  username: string;
  profile_url: string;
  avatar_url: string;
  contributions: number;
}

export type { PluginRelease, PluginReleaseAsset, PluginContributor };
