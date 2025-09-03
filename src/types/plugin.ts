interface PluginRelease {
  name: string;
  tag: string;
  url: string;
  description: string;
  prerelease: boolean;
  date: string;
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

interface PluginCommit {
  sha: string;
  html_url: string;
  message: string;
  date: string;
  author: string;
}

export type { PluginRelease, PluginReleaseAsset, PluginContributor, PluginCommit };
