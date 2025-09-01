import type { RepositoryUser } from "./repository-user";

interface RepositoryContributor extends RepositoryUser {
  contributions: number;
}

export type { RepositoryContributor };
