import type { RestAPIService } from "../index";

abstract class Service {
  /**
   * The name of the service
  */
  public readonly name: string = this.constructor.name;

  /**
   * The api service instance
  */
  public readonly api: RestAPIService;

  /**
   * Creates an instance of the service.
   * @param api The api service instance.
   */
  public constructor(api: RestAPIService) {
    this.api = api;
  }
}

export { Service };
