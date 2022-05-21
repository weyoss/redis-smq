import {
  TConsumerPluginConstructor,
  TProducerPluginConstructor,
} from '../../types';
import { PluginRegistrationNotAllowedError } from './errors/plugin-registration-not-allowed-error';

let disabledPluginRegistration = false;
const consumerPlugins = new Set<TConsumerPluginConstructor>();
const producerPlugins = new Set<TProducerPluginConstructor>();

export function registerConsumerPlugin(
  PluginConstructor: TConsumerPluginConstructor,
): void {
  if (disabledPluginRegistration) {
    throw new PluginRegistrationNotAllowedError();
  }
  consumerPlugins.add(PluginConstructor);
}

export function registerProducerPlugin(
  PluginConstructor: TProducerPluginConstructor,
): void {
  if (disabledPluginRegistration) {
    throw new PluginRegistrationNotAllowedError();
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
