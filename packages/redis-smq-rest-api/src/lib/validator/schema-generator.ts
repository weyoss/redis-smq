/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { readFileSync } from 'fs';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { constants } from '../../config/constants.js';
import { EControllerRequestPayload } from '../controller/types/index.js';
import { RouterRequestValidationError } from '../router/errors/RouterRequestValidationError.js';
import { RouterResponseValidationError } from '../router/errors/RouterResponseValidationError.js';
import { TResponseSchemaMap, TResponseSchemaMapItem } from './types/index.js';
import { ajv } from './validator.js';

const payloadSources = [
  EControllerRequestPayload.PATH,
  EControllerRequestPayload.QUERY,
  EControllerRequestPayload.BODY,
];

export function SchemaGenerator() {
  const schema = readFileSync(constants.jsonSchemaPath);
  const { definitions = {} }: JSONSchema7 = JSON.parse(schema.toString());
  const getDefinition = (name: string): JSONSchema7 => {
    const def = definitions[name];
    if (!def || typeof def === 'boolean')
      throw new Error(`Schema ${name} not found.`);
    return def;
  };
  const getRequestSchema = (
    controllerName: string,
    payloadSource: EControllerRequestPayload,
  ) => {
    const cName = `${controllerName[0].toUpperCase()}${controllerName.slice(
      1,
    )}`;
    const payload = EControllerRequestPayload[payloadSource];
    const pName = payload[0].toUpperCase() + payload.slice(1).toLowerCase();
    const type = `${cName}Request${pName}DTO`;
    return getDefinition(type);
  };
  const getResponseSchema = (controllerName: string) => {
    const cName = `${controllerName[0].toUpperCase()}${controllerName.slice(
      1,
    )}`;
    const type = `${cName}ResponseDTO`;
    const schema = getDefinition(type);
    return getResponseMap(schema);
  };
  const getResponseMap = (schema: JSONSchema7) => {
    const responses = new Map<string, TResponseSchemaMapItem>();
    const handleResponse = (responseSchema: JSONSchema7Definition) => {
      if (
        typeof responseSchema === 'object' &&
        responseSchema.type === 'array' &&
        responseSchema.minItems === 2 &&
        Array.isArray(responseSchema.items)
      ) {
        const [status, message] = responseSchema.items;
        if (
          typeof message === 'object' &&
          typeof status === 'object' &&
          status.type === 'number' &&
          typeof status.const === 'number'
        ) {
          const codeStr = String(status.const);
          const messageStr = String(message.const);
          if (['4', '5'].includes(codeStr[0])) {
            responses.set(messageStr, {
              responseCode: status.const,
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: status,
                      message: message,
                      details: {
                        type: 'object',
                      },
                    },
                    required: ['code', 'message', 'details'],
                    additionalProperties: false,
                  },
                },
                required: ['error'],
                additionalProperties: false,
              },
            });
          } else if (codeStr[0] === '2') {
            const schema: JSONSchema7 =
              status.const === 204
                ? message
                : {
                    type: 'object',
                    properties: {
                      data: message,
                    },
                    required: ['data'],
                    additionalProperties: false,
                  };
            responses.set('OK', {
              responseCode: status.const,
              schema,
            });
          } else throw new Error();
        } else throw new Error();
      } else throw new Error('Expected a JSON Schema type');
    };
    if (schema.anyOf) {
      for (const responseSchema of schema.anyOf) handleResponse(responseSchema);
    } else handleResponse(schema);
    return responses;
  };
  return {
    getDefinitions() {
      return definitions;
    },
    getRequestSchemas(
      controllerName: string,
      requestPayloadSource: EControllerRequestPayload[],
    ) {
      return payloadSources.reduce<Map<EControllerRequestPayload, JSONSchema7>>(
        (accumulator, currentValue) => {
          const schemaDefinition: JSONSchema7 = requestPayloadSource.includes(
            currentValue,
          )
            ? getRequestSchema(controllerName, currentValue)
            : {
                type: 'object',
                additionalProperties: false,
              };
          accumulator.set(currentValue, schemaDefinition);
          return accumulator;
        },
        new Map(),
      );
    },
    getRequestValidators(map: Map<EControllerRequestPayload, JSONSchema7>) {
      return payloadSources.reduce<
        Map<EControllerRequestPayload, (data: unknown) => void>
      >((accumulator, currentValue) => {
        const schema = map.get(currentValue);
        if (!schema) throw new Error();
        const validator = ajv.compile(schema);
        const validatorFn = (data: unknown) => {
          const isValid = validator(data);
          if (!isValid && validator.errors) {
            throw new RouterRequestValidationError(validator.errors);
          }
        };
        accumulator.set(currentValue, validatorFn);
        return accumulator;
      }, new Map());
    },
    getResponseSchemas(controllerName: string) {
      return getResponseSchema(controllerName);
    },
    getResponseValidators(map: TResponseSchemaMap) {
      const m = new Map<string, (data: unknown) => void>();
      map.forEach((value, key) => {
        const validator = ajv.compile(value.schema);
        const validatorFn = (data: unknown) => {
          const isValid = validator(data);
          if (!isValid && validator.errors) {
            throw new RouterResponseValidationError(validator.errors);
          }
        };
        m.set(key, validatorFn);
      });
      return m;
    },
  };
}
