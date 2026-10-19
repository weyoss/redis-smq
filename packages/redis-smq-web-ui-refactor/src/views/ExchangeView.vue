<!--
  - Copyright (c)
  - Weyoss <weyoss@outlook.com>
  - https://github.com/weyoss
  -
  - This source code is licensed under the MIT license found in the LICENSE file
  - in the root directory of this source tree.
  -->

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageShell from '@/components/ui/PageShell.vue';
import Card from '@/components/ui/Card.vue';
import StateBlock from '@/components/ui/StateBlock.vue';
import ConfirmationModal from '@/components/modals/ConfirmationModal.vue';
import BindQueueModal from '@/components/modals/BindQueueModal.vue';
import UnbindQueueModal from '@/components/modals/UnbindQueueModal.vue';
import { useExchangeDetail } from '@/composables/useExchangeDetail';
import {
  useExchangeBindings,
  FANOUT_KEY,
} from '@/composables/useExchangeBindings';
import { useTypedRouter } from '@/router/typed';
import { getErrorMessage } from '@/lib/error';
import { useDeleteExchange } from '@/api/generated/namespace-exchanges/namespace-exchanges';
import {
  EExchangeType,
  ExchangeTypeIcon,
  ExchangeTypeLabel,
} from '@/types/exchanges';
import type { PageAction } from '@/components/ui/PageShell.vue';
import ExchangeMatchCard from '@/components/exchange/ExchangeMatchCard.vue';

const route = useRoute();
const router = useTypedRouter();

const ns = computed(() => String(route.params.ns ?? ''));
const exchangeName = computed(() => String(route.params.exchange ?? ''));

const exchange = useExchangeDetail(
  computed(() =>
    ns.value && exchangeName.value
      ? { ns: ns.value, name: exchangeName.value }
      : null,
  ),
);
const bindings = useExchangeBindings(exchange.data);

const showBind = ref(false);
const unbindTarget = ref<{ queueName: string; bindingKey?: string } | null>(
  null,
);
const showDelete = ref(false);
const deleteError = ref<string | null>(null);

const deleteMutation = useDeleteExchange({
  mutation: {
    onSuccess: () => {
      showDelete.value = false;
      router.go('exchanges');
    },
  },
});

async function onConfirmDelete() {
  deleteError.value = null;
  try {
    await deleteMutation.mutateAsync({
      ns: ns.value,
      exchange: exchangeName.value,
    });
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

function onBindSuccess() {
  showBind.value = false;
  bindings.refetch();
  exchange.refetch();
}

function onUnbindSuccess() {
  unbindTarget.value = null;
  bindings.refetch();
  exchange.refetch();
}

const typeLabel = computed(() =>
  exchange.data.value ? ExchangeTypeLabel[exchange.data.value.type] : '',
);
const typeIcon = computed(() =>
  exchange.data.value
    ? ExchangeTypeIcon[exchange.data.value.type]
    : 'bi-question',
);

const canDelete = computed(
  () => !!exchange.data.value && bindings.totalQueues.value === 0,
);

const exchangeForModal = computed(() => ({
  name: exchange.data.value?.name ?? '',
  type: exchange.data.value?.type ?? EExchangeType.DIRECT,
}));

const actions = computed<PageAction[]>(() => [
  {
    id: 'bind',
    label: 'Bind queue',
    icon: 'bi-link-45deg',
    variant: 'primary',
    disabled: !exchange.data.value,
    onClick: () => (showBind.value = true),
  },
  {
    id: 'refresh',
    label: 'Refresh',
    icon: 'bi-arrow-clockwise',
    variant: 'secondary',
    loading: exchange.isLoading.value || bindings.isLoading.value,
    onClick: () => {
      exchange.refetch();
      bindings.refetch();
    },
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: 'bi-trash',
    variant: 'danger',
    disabled: !canDelete.value,
    tooltip: canDelete.value ? 'Delete exchange' : 'Unbind all queues first',
    onClick: () => {
      deleteError.value = null;
      showDelete.value = true;
    },
  },
]);

// Keep FANOUT_KEY referenced so the compiler doesn't tree-shake it away
// when the value ends up in the template via v-if in the future.
void FANOUT_KEY;
void EExchangeType;
</script>

<template>
  <PageShell
    :title="`Exchange: ${exchangeName}`"
    :subtitle="`${typeLabel} exchange in ${ns}`"
    :icon="typeIcon"
    :actions="actions"
    :loading="exchange.isLoading.value"
    :error="exchange.error.value"
  >
    <template v-if="exchange.data.value">
      <Card title="Bindings" :heading-level="2" :icon="typeIcon">
        <template #actions>
          <span class="badge bg-secondary">{{
            bindings.totalQueues.value
          }}</span>
        </template>
        <StateBlock v-if="bindings.isLoading.value" kind="loading" />
        <StateBlock
          v-else-if="bindings.error.value"
          kind="error"
          icon="bi-exclamation-triangle-fill"
          :message="bindings.error.value"
        />
        <StateBlock
          v-else-if="bindings.bindings.value.length === 0"
          kind="empty"
          icon="bi-link"
          title="No bindings"
          message="Bind a queue to route messages."
        />
        <div v-else class="binding-list">
          <div
            v-for="b in bindings.bindings.value"
            :key="b.key"
            class="binding-group"
          >
            <h4
              v-if="b.key !== FANOUT_KEY"
              class="binding-group__title font-mono"
            >
              {{ b.key }}
            </h4>
            <ul class="binding-group__queues">
              <li
                v-for="q in b.queues"
                :key="`${q.ns}-${q.name}`"
                class="binding-queue"
              >
                <i class="bi bi-collection" aria-hidden="true" />
                <span class="font-mono binding-queue__name">{{ q.name }}</span>
                <button
                  type="button"
                  class="btn btn-icon btn-outline-danger binding-queue__unbind"
                  title="Unbind"
                  aria-label="Unbind"
                  @click="
                    unbindTarget = {
                      queueName: q.name,
                      bindingKey: b.key === FANOUT_KEY ? undefined : b.key,
                    }
                  "
                >
                  <i class="bi bi-x" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </Card>
      <ExchangeMatchCard
        v-if="exchange.data.value"
        :ns="ns"
        :exchange="exchangeName"
        :type="exchange.data.value.type"
      />
    </template>
  </PageShell>

  <BindQueueModal
    :is-visible="showBind"
    :namespace="ns"
    :exchange="exchangeForModal"
    @close="showBind = false"
    @success="onBindSuccess"
  />

  <UnbindQueueModal
    :is-visible="!!unbindTarget"
    :namespace="ns"
    :exchange="exchangeForModal"
    :queue-name="unbindTarget?.queueName ?? ''"
    :binding-key="unbindTarget?.bindingKey"
    @close="unbindTarget = null"
    @success="onUnbindSuccess"
  />

  <ConfirmationModal
    :is-visible="showDelete"
    title="Delete exchange"
    subtitle="This action cannot be undone"
    icon="bi-exclamation-triangle"
    :message="`Delete exchange ${exchangeName}@${ns}?`"
    confirm-label="Delete exchange"
    confirm-variant="danger"
    :is-pending="deleteMutation.isPending.value"
    :error="deleteError"
    @close="showDelete = false"
    @confirm="onConfirmDelete"
  />
</template>

<style scoped>
.binding-list {
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-3);
}
.binding-group__title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--rsmq-color-text-muted);
  margin: 0 0 var(--rsmq-space-2);
}
.binding-group__queues {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--rsmq-space-1);
}
.binding-queue {
  display: flex;
  align-items: center;
  gap: var(--rsmq-space-2);
  padding: var(--rsmq-space-2) var(--rsmq-space-3);
  background: var(--rsmq-color-bg);
  border-radius: var(--rsmq-radius-sm);
  font-size: 0.9rem;
}
.binding-queue__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.binding-queue__unbind {
  min-width: 1.75rem;
  min-height: 1.75rem;
  padding: 0.1rem;
  flex-shrink: 0;
}
</style>
