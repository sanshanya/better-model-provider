/**
 * English and Chinese copy for the Model capabilities section.
 *
 * @module better-model-provider/locales
 */

/** A locale-bound translator over this section's copy keys. */
export type TFn = (key: CapsKey, params?: Record<string, string | number>) => string

/** English dictionary — the key source. */
export const en = {
  nav: 'Model capabilities',
  title: 'Model capabilities',
  intro:
    'Declare, per model, which reasoning-effort levels it accepts, which request modalities '
    + 'it admits, and which token capacities it carries. The declarations land in the provider '
    + 'profile as soon as you apply a row.',
  loading: 'Loading providers…',
  retry: 'Retry now',
  conflict: 'The settings document changed elsewhere. Your edits are kept below — review the refreshed state, then apply again.',
  empty: 'No configurable providers yet',
  emptyHint:
    'Expand Manage official providers below to onboard an installed provider, or configure a '
    + 'custom route on the official Models page first.',
  declaredRoute: 'declared',
  officialCatalog: 'official catalog',
  catalogIntro:
    'Sparse capability overrides over the installed official catalog. Untouched fields keep the '
    + 'official defaults and follow future catalog updates — nothing is copied.',
  manageOfficial: 'Manage official models',
  officialModelsCount: '{count} official models',
  overriddenCount: '{count} overridden',
  keepOfficial: 'Keep official',
  disableReasoning: 'Disable reasoning',
  customMapping: 'Custom mapping',
  wireMapNote:
    'Overriding reasoning declares its own wire map: every checked level names the exact spelling '
    + 'sent to the endpoint (only off may stay blank).',
  officialValue: 'Official: {value}',
  resetOfficial: 'Reset to official defaults',
  catalogLoadError: 'Could not load the official model list',
  manageOfficialProviders: 'Manage official providers ({count})',
  dormantHint:
    'Not configured yet — the first override you apply creates the profile. '
    + 'The API key still belongs to the official Models page.',
  officialUserList: 'official · user-listed',
  inheritedRoute: 'inherited list',
  adapterBoundary:
    'Routes owned by dedicated adapters (lived under llm-deepseek / llm-openai-codex) declare '
    + 'capabilities in their adapter code and never appear here; a pi-ai catalog route of the same '
    + 'brand name is a different route and does appear.',
  inheritedModelList: 'This model list is inherited from the active composition and is read-only here.',
  readOnly: 'Settings are read-only in this view',
  expand: 'expand',
  collapse: 'collapse',
  modelContextWindow: 'Context window',
  modelMaxTokens: 'Max output tokens',
  modelReasoning: 'Reasoning effort',
  inherit: 'Provider default',
  reasoningOff: 'No reasoning (false)',
  custom: 'Custom',
  wire: 'wire',
  modelInput: 'Input modalities',
  apply: 'Apply',
  revert: 'Revert',
  applying: 'Applying…',
  modelReasoningInvalid:
    'invalid reasoning declaration: name a level beyond off, and give each level beyond off a wire value',
  modelInputInvalid: 'invalid input modalities: choose from the declared vocabulary',
  modelCapacityInvalid: 'invalid capacity: use a positive whole count, K for thousands, M for millions (blank inherits)',
  staged: 'unapplied',
  levelsSelected: '{count} selected',
  levelGroup: 'Reasoning effort levels of {model}',
  modalityGroup: 'Input modalities of {model}',
} as const

/** Union of copy keys the section consumes. */
export type CapsKey = keyof typeof en

/** Chinese dictionary, one-to-one with `en`. */
export const zh: Record<CapsKey, string> = {
  nav: '模型能力',
  title: '模型能力',
  intro: '按模型声明它的推理强度档位、请求模态与 token 容量（上下文窗口 / 最大输出）。应用后，声明即刻写入供应商 profile。',
  loading: '正在加载供应商…',
  retry: '立即重试',
  conflict: '设置文档已在别处变更。你的编辑保留在下方——请先对照刚刷新的状态，再重新应用。',
  empty: '暂无可配置的供应商',
  emptyHint: '展开下方「管理官方供应商」接入驻装的供应商，或先在官方「模型」页配置一条自定义路由。',
  declaredRoute: '手工声明',
  officialCatalog: '官方目录',
  catalogIntro: '对随 pi-ai 驻装的官方目录做稀疏能力覆盖。未触碰的字段保持官方默认并跟随目录将来更新——不复制任何内容。',
  manageOfficial: '管理官方模型',
  officialModelsCount: '{count} 个官方模型',
  overriddenCount: '{count} 个已覆盖',
  keepOfficial: '跟随官方',
  disableReasoning: '禁用推理',
  customMapping: '自定义映射',
  wireMapNote: '覆盖推理即自行声明拼写表：勾选的每个档位都要填发往端点的准确拼写（只有 off 可留空）。',
  officialValue: '官方：{value}',
  resetOfficial: '还原为官方默认',
  catalogLoadError: '无法加载官方模型列表',
  manageOfficialProviders: '管理官方供应商（{count}）',
  dormantHint: '尚未配置——你应用的第一个覆盖即会创建该 profile。API 密钥仍在官方「模型」页设置。',
  officialUserList: '官方·自管',
  inheritedRoute: '继承清单',
  adapterBoundary: '专属适配器路由（如 llm-deepseek、llm-openai-codex 名下的）能力写在其适配器代码里，不会出现在本页；同品牌名的 pi-ai 目录路由是另一条路由，照常出现。',
  inheritedModelList: '此模型列表继承自当前组装，本页只读。',
  readOnly: '此视图下设置为只读',
  expand: '展开',
  collapse: '收起',
  modelContextWindow: '上下文窗口',
  modelMaxTokens: '最大输出 token',
  modelReasoning: '推理强度',
  inherit: '使用供应商默认',
  reasoningOff: '无推理（false）',
  custom: '自定义',
  wire: '取值',
  modelInput: '输入模态',
  apply: '应用',
  revert: '还原',
  applying: '应用中…',
  modelReasoningInvalid: '推理声明无效：至少声明一个 off 之外的档位，且 off 之外的档位都要有取值',
  modelInputInvalid: '输入模态无效：请从已声明的词汇中选择',
  modelCapacityInvalid: '容量无效：请填正整数计数，K 表示千、M 表示百万（留空为继承）',
  staged: '未应用',
  levelsSelected: '已选择 {count} 个',
  levelGroup: '{model} 的推理强度档位',
  modalityGroup: '{model} 的输入模态',
}
