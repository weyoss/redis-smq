/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defineStore } from 'pinia';
import { ref, computed, type Ref } from 'vue';

export interface PageAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'refresh';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  handler: () => void;
}

export interface PageContentState {
  // Page Header
  pageTitle: string;
  pageSubtitle?: string;
  pageIcon?: string;
  pageActions: PageAction[];

  // Section Header
  sectionTitle?: string;
  sectionMeta?: string;

  // Content State
  isLoading: boolean;
  error?: {
    title?: string;
    message: string;
    details?: object;
  } | null;
  isEmpty: boolean;
  emptyStateConfig?: {
    icon: string;
    title: string;
    message: string;
    actionLabel?: string;
    actionHandler?: () => void;
  };
}

export const usePageContentStore = defineStore('pageContent', () => {
  // State
  const state = ref<PageContentState>({
    pageTitle: '',
    pageSubtitle: undefined,
    pageIcon: undefined,
    pageActions: [],
    sectionTitle: undefined,
    sectionMeta: undefined,
    isLoading: false,
    error: null,
    isEmpty: false,
    emptyStateConfig: undefined,
  });

  // Getters
  const hasPageActions = computed(() => state.value.pageActions.length > 0);
  const hasSectionHeader = computed(
    () => !!(state.value.sectionTitle || state.value.sectionMeta),
  );
  const hasError = computed(() => !!state.value.error);
  const showEmptyState = computed(
    () => state.value.isEmpty && !state.value.isLoading && !hasError.value,
  );

  // Actions
  function setPageHeader(config: {
    title: string;
    subtitle?: string;
    icon?: string;
  }) {
    state.value.pageTitle = config.title;
    state.value.pageSubtitle = config.subtitle;
    state.value.pageIcon = config.icon;
  }

  function setPageActions(actions: PageAction[]) {
    state.value.pageActions = actions;
  }

  function addPageAction(action: PageAction) {
    const existingIndex = state.value.pageActions.findIndex(
      (a) => a.id === action.id,
    );
    if (existingIndex >= 0) {
      state.value.pageActions[existingIndex] = action;
    } else {
      state.value.pageActions.push(action);
    }
  }

  function removePageAction(actionId: string) {
    state.value.pageActions = state.value.pageActions.filter(
      (a) => a.id !== actionId,
    );
  }

  function updatePageAction(actionId: string, updates: Partial<PageAction>) {
    const action = state.value.pageActions.find((a) => a.id === actionId);
    if (action) {
      Object.assign(action, updates);
    }
  }

  function setSectionHeader(config: { title?: string; meta?: string }) {
    state.value.sectionTitle = config.title;
    state.value.sectionMeta = config.meta;
  }

  function setLoadingState(isLoading: boolean) {
    state.value.isLoading = isLoading;
    if (isLoading) {
      state.value.error = null;
    }
  }

  function setErrorState(error: { message: string; details?: object } | null) {
    state.value.error = error;
    if (error) {
      state.value.isLoading = false;
    }
  }

  function setEmptyState(
    isEmpty: boolean,
    config?: PageContentState['emptyStateConfig'],
  ) {
    state.value.isEmpty = isEmpty;
    state.value.emptyStateConfig = config;
  }

  function resetPageContent() {
    state.value = {
      pageTitle: '',
      pageSubtitle: undefined,
      pageIcon: undefined,
      pageActions: [],
      sectionTitle: undefined,
      sectionMeta: undefined,
      isLoading: false,
      error: null,
      isEmpty: false,
      emptyStateConfig: undefined,
    };
  }

  function setPageContent(config: Partial<PageContentState>) {
    Object.assign(state.value, config);
  }

  return {
    // State
    state: state as Readonly<Ref<PageContentState>>,

    // Getters
    hasPageActions,
    hasSectionHeader,
    hasError,
    showEmptyState,

    // Actions
    setPageHeader,
    setPageActions,
    addPageAction,
    removePageAction,
    updatePageAction,
    setSectionHeader,
    setLoadingState,
    setErrorState,
    setEmptyState,
    resetPageContent,
    setPageContent,
  };
});
