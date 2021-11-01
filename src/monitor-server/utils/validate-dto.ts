import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDTO<T extends Record<string, any>>(
  dto: ClassConstructor<T>,
  plain: Record<string, any>,
): Promise<T> {
  const object = plainToClass(dto, plain);
  if (!Object.keys(object).length) {
    return object;
  }
  const errors = await validate(object, {
    stopAtFirstError: true,
    forbidUnknownValues: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length) {
    throw errors[0];
  }
  return object;
}
