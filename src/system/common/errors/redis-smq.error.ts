export abstract class RedisSMQError extends Error {
  get name(): string {
    return this.constructor.name;
  }
}
