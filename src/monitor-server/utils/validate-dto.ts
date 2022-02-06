import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDTO<T extends Record<string, any>>(
  dto: ClassConstructor<T>,
  plain: Record<string, any>,
): Promise<T> {
  const object = plainToClass(dto, plain);
  const errors = await validate(object, {
    stopAtFirstError: true,
    // See https://github.com/typestack/class-validator/issues/305#issuecomment-504778830
    // forbidUnknownValues: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length) {
    throw errors[0];
  }
  return object;
}
