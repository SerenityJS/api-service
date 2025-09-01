interface RepositoryLicense {
  key: string;
  name: string;
  spdx_id: string | null;
  url: string | null;
  node_id: string;
}

export type { RepositoryLicense };
