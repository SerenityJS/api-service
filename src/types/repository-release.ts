import type { ReleaseAsset } from "./release-asset";
import type { RepositoryUser } from "./repository-user";

interface RepositoryRelease {
  url: string;
  assets_url: string;
  upload_url: string; // templated: ...{?name,label}
  html_url: string;
  id: number;
  author: RepositoryUser;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  draft: boolean;
  immutable: boolean;
  prerelease: boolean;
  created_at: string;   // ISO date
  updated_at: string;   // ISO date
  published_at: string; // ISO date
  assets: Array<ReleaseAsset>;
  tarball_url: string;
  zipball_url: string;
  body: string | null;
}

export type { RepositoryRelease };
