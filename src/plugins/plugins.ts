import {
  TConsumerPluginConstructor,
  TProducerPluginConstructor,
} from '../../types';
import { PluginError } from './errors/plugin-error';

let disabledPluginRegistration = false;
const consumerPlugins = new Set<TConsumerPluginConstructor>();
const producerPlugins = new Set<TProducerPluginConstructor>();

export function registerConsumerPlugin(
  PluginConstructor: TConsumerPluginConstructor,
): void {
  if (disabledPluginRegistration) {
    throw new PluginError(
      `Plugin registration is allowed before starting a consumer or producer`,
    );
  }
  consumerPlugins.add(PluginConstructor);
}

export function registerProducerPlugin(
  PluginConstructor: TProducerPluginConstructor,
): void {
  if (disabledPluginRegistration) {
    throw new PluginError(
      `Plugin registration is allowed before starting a consumer or producer`,
    );
  }
  producerPlugins.add(PluginConstructor);
}

export function getConsumerPlugins(): TConsumerPluginConstructor[] {
  return [...consumerPlugins];
}

export function getProducerPlugins(): TProducerPluginConstructor[] {
  return [...producerPlugins];
}

export function disablePluginRegistration(): void {
  if (!disabledPluginRegistration) disabledPluginRegistration = true;
}
