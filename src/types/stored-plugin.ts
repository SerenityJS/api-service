import type { PluginContributor } from "./plugin";

interface StoredPlugin {
  id: number;
  name: string;
  owner: PluginContributor;
  url: string;
  branch: string;
  approved: boolean;
}

export type { StoredPlugin };
