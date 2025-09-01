import type { RepositoryUser } from "./repository-user";

interface ReleaseAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string | null;
  uploader: RepositoryUser;
  content_type: string;
  state: "uploaded" | "open" | "temporary" | string;
  size: number;
  download_count: number;
  created_at: string;   // ISO date
  updated_at: string;   // ISO date
  browser_download_url: string;
}

export type { ReleaseAsset };
