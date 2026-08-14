/**
 * English and Chinese copy for the Model capabilities section.
 *
 * @module better-model-provider/locales
 */

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
  empty: 'No providers yet',
  emptyHint:
    'Configure a provider on the official Models page first; its models appear here.',
  declaredRoute: 'declared',
  unknownRoute: 'unknown route',
  inheritedModelList: 'This model list is inherited from the active composition and is read-only here.',
  unknownRouteHint: 'The adapter did not identify this route as declared or catalogued, so capability editing is disabled.',
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
  intro: '按模型声明它的推理强度档位、请求模态与 token 容量（上下文窗口 / 最大输出）。应用后，声明即刻写入提供方 profile。',
  loading: '正在加载提供方…',
  retry: '立即重试',
  conflict: '设置文档已在别处变更。你的编辑保留在下方——请先对照刚刷新的状态，再重新应用。',
  empty: '暂无提供方',
  emptyHint: '请先在官方「模型」页配置提供方；其模型会出现在这里。',
  declaredRoute: '手工声明',
  unknownRoute: '未知路由',
  inheritedModelList: '此模型列表继承自当前组装，本页只读。',
  unknownRouteHint: '适配器没有说明该路由属于手工声明还是目录，本页已禁用能力编辑。',
  readOnly: '此视图下设置为只读',
  expand: '展开',
  collapse: '收起',
  modelContextWindow: '上下文窗口',
  modelMaxTokens: '最大输出 token',
  modelReasoning: '推理强度',
  inherit: '使用提供方默认',
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
