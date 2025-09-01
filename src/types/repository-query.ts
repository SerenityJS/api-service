import type { Repository } from "./repository";

interface RepositoryQuery {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}

export type { RepositoryQuery };
