export abstract class RedisSMQError extends Error {
  override get name(): string {
    return this.constructor.name;
  }
}
