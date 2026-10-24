/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Shared CSS selectors. Every spec imports from here — never hardcodes
 * a class. Role-based selectors (`getByRole`) are still preferred for
 * interactive elements; this file is for structural selectors that
 * don't have a natural ARIA role.
 *
 * Names mirror the BEM classes in the corresponding components:
 *   rsmq-modal        → src/components/ui/BaseModal.vue
 *   state-block--*    → src/components/ui/StateBlock.vue
 *                     → src/components/ui/PageShell.vue (error only)
 *   ui-card           → src/components/ui/Card.vue
 *   stat-card         → src/components/ui/StatCard.vue
 *   msg-row-wrap      → src/components/message/MessageListItem.vue
 *   queue-row         → src/components/queue/QueueListItem.vue
 *   group-list__row   → src/components/queue/ConsumerGroupsCard.vue
 *   bulk-bar          → src/views/MessagesView.vue
 *   exchange-card     → src/components/exchange/ExchangeCard.vue
 *   binding-queue     → src/views/ExchangeView.vue
 *   mp-*              → src/components/exchange/ExchangeMatchCard.vue
 *   namespace-card    → src/components/namespace/NamespaceCard.vue
 *   ns-summary        → src/components/namespace/NamespaceCard.vue (modal)
 *   …
 */
export const SEL = {
  // ── Shell ────────────────────────────────────────────────────────────
  header: '.app-header',
  footer: '.app-footer',
  brand: '.app-header__brand',
  navLink: '.app-header__link',
  navLinkActive: '.app-header__link--active',
  configLink: '.app-header__link--settings',

  // ── API health indicator (in footer) ─────────────────────────────────
  health: '.api-health',
  healthDot: '.api-health__dot',
  healthUp: '.api-health--up',
  healthDown: '.api-health--down',
  healthChecking: '.api-health--checking',

  // ── Page shell ───────────────────────────────────────────────────────
  pageTitle: 'h1',
  pageSubtitle: '.page-subtitle',
  pageActions: '.page-actions',
  pageAction: '.page-action',

  // ── State blocks (loading / error / empty) ───────────────────────────
  stateBlock: '.state-block',
  stateLoading: '.state-block--loading',
  stateError: '.state-block--error',
  stateEmpty: '.state-block--empty',
  stateTitle: '.state-block__title',
  stateMessage: '.state-block__message',

  // ── Card ─────────────────────────────────────────────────────────────
  card: '.ui-card',
  cardHeader: '.ui-card__header',
  cardTitle: '.ui-card__title',
  cardSubtitle: '.ui-card__subtitle',
  cardActions: '.ui-card__actions',
  cardBody: '.ui-card__body',

  // ── StatCard ─────────────────────────────────────────────────────────
  statCard: '.stat-card',
  statCardLabel: '.stat-card__label',
  statCardValue: '.stat-card__value',

  // ── Modal (BaseModal + ConfirmationModal) ────────────────────────────
  modalScrim: '.rsmq-modal-scrim',
  modal: '.rsmq-modal',
  modalHeader: '.rsmq-modal__header',
  modalTitle: '.rsmq-modal__title',
  modalSubtitle: '.rsmq-modal__subtitle',
  modalClose: '.rsmq-modal__close',
  modalBody: '.rsmq-modal__body',
  modalFooter: '.rsmq-modal__footer',

  // ── Error surfaces ───────────────────────────────────────────────────
  alertDanger: '.alert-danger',
  fieldError: '.field-error, .invalid-feedback',

  // ── Queues list ──────────────────────────────────────────────────────
  queueRow: '.queue-row',
  queueRowMain: '.queue-row__main',
  queueRowName: '.queue-row__name',
  queueRowNs: '.queue-row__ns',
  queueRowActions: '.queue-row__actions',

  // ── Messages list ────────────────────────────────────────────────────
  msgRow: '.msg-row',
  msgRowWrap: '.msg-row-wrap',
  msgRowSelected: '.msg-row-wrap--selected',
  msgRowCheck: '.msg-row__check',
  msgRowCheckbox: '.msg-row__check input',
  msgRowBody: '.msg-row__body',

  // ── Message tabs ─────────────────────────────────────────────────────
  messageTabs: '.tabs',
  messageTab: '.tabs__link',
  messageTabActive: '.tabs__link--active',

  // ── View-message modal ───────────────────────────────────────────────
  vmTabs: '.vm-tabs',
  vmTab: '.vm-tab',
  vmTabActive: '.vm-tab--active',
  vmBody: '.vm-body',
  vmFooter: '.vm-footer',
  vmFooterFlash: '.vm-footer__flash',

  // ── Bulk toolbar (appears when any row is selected) ──────────────────
  bulkBar: '.bulk-bar',
  bulkCount: '.bulk-bar__count',
  bulkMaster: '.bulk-bar__master',

  // ── Group banner (pub/sub pending view, group selected) ──────────────
  groupBanner: '.group-banner',
  groupBannerChange: '.group-banner__change',

  // ── Consumer group selector (no group chosen yet) ────────────────────
  cgRow: '.cg-row',
  cgName: '.cg-row__name',

  // ── Consumer groups list (inside ConsumerGroupsCard) ─────────────────
  groupListRow: '.group-list__row',
  groupListName: '.group-list__name',

  // ── Queue detail cards ───────────────────────────────────────────────
  consumerCount: '.consumer-count',
  exchangeCount: '.exchange-count',
  stateBanner: '.state-banner',
  stateBannerWarning: '.state-banner--warning',
  stateBannerDanger: '.state-banner--danger',
  stateBannerSecondary: '.state-banner--secondary',

  // ── Configuration view ───────────────────────────────────────────────
  configGrid: '.config-grid',

  // ── Pagination ───────────────────────────────────────────────────────
  pagination: '.pagination',
  paginationSummary: '.pagination__summary',
  paginationPages: '.pagination__pages',

  // ── Exchange cards (ExchangeCard.vue) ────────────────────────────────
  exchangeGrid: '.exchange-grid',
  exchangeCard: '.exchange-card',
  exchangeCardHead: '.exchange-card__head',
  exchangeCardTitle: '.exchange-card__title',
  exchangeCardSubtitle: '.exchange-card__subtitle',
  exchangeCardBody: '.exchange-card__body',
  exchangeCardState: '.exchange-card__state',
  exchangeCardBindings: '.exchange-card__bindings',
  exchangeCardFoot: '.exchange-card__foot',

  // ── Exchange detail — bindings (ExchangeView.vue) ────────────────────
  bindingList: '.binding-list',
  bindingGroup: '.binding-group',
  bindingGroupTitle: '.binding-group__title',
  bindingQueue: '.binding-queue',
  bindingQueueName: '.binding-queue__name',
  bindingQueueUnbind: '.binding-queue__unbind',

  // ── Exchange match preview (ExchangeMatchCard.vue) ───────────────────
  matchForm: '.mp-form',
  matchInput: '#mp-routing-key',
  matchResults: '.mp-results',
  matchResultsList: '.mp-results__list',
  matchResultsItem: '.mp-results__item',
  matchIdle: '.mp-idle',

  // ── Namespace cards (NamespaceCard.vue) ──────────────────────────────
  namespaceGrid: '.namespace-grid',
  namespaceCard: '.namespace-card',
  namespaceCardHead: '.namespace-card__head',
  namespaceCardTitle: '.namespace-card__title',
  namespaceCardDelete: '.namespace-card__delete',
  namespaceCardBody: '.namespace-card__body',
  /** One of two clickable stat tiles inside a namespace card
   *  ("Queues" / "Exchanges"). Filter by `hasText` to disambiguate. */
  namespaceCardStat: '.namespace-card__stat',
  namespaceCardStatValue: '.namespace-card__stat-value',
  namespaceCardStatLabel: '.namespace-card__stat-label',

  // ── Namespace delete modal extras (NamespaceCard.vue) ────────────────
  nsSummary: '.ns-summary',
  nsSummaryCounts: '.ns-summary__counts',
  nsSummaryWarning: '.ns-summary__warning',

  // ── Configuration view (ConfigurationView.vue) ───────────────────────
  /** The `<p class="value">` that renders the namespace, falling back
   *  to "default" when empty. Scoped to the namespace card by the
   *  test — the class name is generic so don't match it globally. */
  configNamespaceValue: '.value',
  /** The logger details grid (log level, colorize, include timestamp). */
  configKvGrid: '.kv-grid',
  /** "Logger is disabled." paragraph shown when `logger.enabled` is false. */
  configMuted: '.muted',
  /** One of the three message-audit blocks. Filter by `hasText` to pick
   *  the acknowledged / dead-lettered / unacknowledgement-history row. */
  configAuditSection: '.audit-section',
  configAuditLabel: '.audit-row__label',
  configAuditSummary: '.audit-row__summary',

  // ── Home view (HomeView.vue) ─────────────────────────────────────────
  hero: '.hero',
  heroTitle: '.hero__title',
  heroSubtitle: '.hero__subtitle',
  heroCta: '.hero__cta',

  // ── Quick actions (HomeView.vue) ─────────────────────────────────────
  quickGrid: '.quick-grid',
  quickTile: '.quick-tile',
  quickTileTitle: '.quick-tile__title',
  quickTileDesc: '.quick-tile__desc',

  // ── Recent queues (HomeView.vue) ─────────────────────────────────────
  recentList: '.recent',
  recentLink: '.recent__link',
  recentName: '.recent__name',

  // ── Getting started steps (HomeView.vue) ─────────────────────────────
  gettingStarted: '.steps',
  gettingStartedItem: '.steps__item',
  gettingStartedActions: '.steps__actions',

  // ── Shell a11y ───────────────────────────────────────────────────────
  /** The "Skip to main content" link in DefaultLayout.vue. */
  skipLink: '.skip-link',
  /** The `<main>` element that the skip link targets. */
  mainContent: '#main-content',
} as const;

export type SelectorName = keyof typeof SEL;
