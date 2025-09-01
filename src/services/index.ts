import { Discord } from "./discord";
import { GHFetch } from "./gh-fetch";

export * from "./service";

const Services = [
  GHFetch,
  Discord
];

export { Services };