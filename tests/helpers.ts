/**
 * Shared test scaffolding: a scripted wire face (`settings` + `llm`) plus a
 * realistic llm-pi-ai namespace view whose serialized schema carries both
 * capability fields, so the editor's schema reads and the write paths are
 * exercised against the same shapes the harness serves.
 */

import Schema from '@deepseek-ai/schemastery'
import type { RpcError, RpcId, RpcResponse } from '@deepseek-ai/dsh-api-remotes/client'
import type {
  ConfigurableProviderView, DiscoveredModelView, IRemoteApi, SettingsNamespaceView,
  SettingsPathOpView,
} from '../src/client/types.ts'

/**
 * The read methods this plugin calls take exactly one payload: `{}`. The
 * host validates each against `z.object({})`; a mock that accepted anything
 * else would prove nothing about the wire, so the scripted face refuses a
 * wrong payload the way the schema would.
 */
export function assertEmptyPayload(method: string, payload: unknown): void {
  if (typeof payload !== 'object' || payload === null || Object.keys(payload).length !== 0) {
    throw new Error(`scriptedFace: ${method} expects exactly {}, got ${JSON.stringify(payload)}`)
  }
}

/** Stable reasoning levels the fixture schema declares. */
export const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

/** Stable request modalities the fixture schema declares. */
export const MODALITIES = ['text', 'image']

/** One recorded mutate call. */
export interface RecordedMutate {
  ns: string
  ops: SettingsPathOpView[]
  expectedRevision: number | undefined
}

/** The settings values used by this fixture are JSON-shaped plain data. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Clone one served value so each response behaves like an independent wire snapshot. */
function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => clone(item)) as T
  if (isRecord(value)) {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) out[key] = clone(item)
    return out as T
  }
  return value
}

/** Merge layered settings the way the settings document exposes them: objects merge, arrays replace. */
/** Host-faithful merge for fixture values: objects merge, arrays/scalars replace. */
export function mergeLayers(base: unknown, user: unknown): unknown {
  if (user === undefined) return clone(base)
  if (!isRecord(base) || !isRecord(user)) return clone(user)
  const merged = clone(base)
  if (!isRecord(merged)) return clone(user)
  for (const [key, value] of Object.entries(user)) merged[key] = mergeLayers(merged[key], value)
  return merged
}

/** Apply one path operation to the raw user section in the test-only server. */
function applyOp(root: unknown, op: SettingsPathOpView): unknown {
  if (op.path.length === 0) return op.op === 'set' ? clone(op.value) : undefined
  const next = isRecord(root) ? clone(root) : {}
  if (!isRecord(next)) return next
  let cursor = next
  const parents = op.path.slice(0, -1)
  for (const segment of parents) {
    const child = cursor[segment]
    if (!isRecord(child)) cursor[segment] = {}
    cursor = cursor[segment] as Record<string, unknown>
  }
  const leaf = op.path[op.path.length - 1]
  if (leaf === undefined) return next
  if (op.op === 'set') cursor[leaf] = clone(op.value)
  else Reflect.deleteProperty(cursor, leaf)
  return next
}

/** Apply a full mutate request and derive the next effective namespace view. */
function applySettingsMutation(arrange: FaceArrangement, ops: readonly SettingsPathOpView[]): void {
  let user = arrange.user
  for (const op of ops) user = applyOp(user, op)
  arrange.user = user
  arrange.value = mergeLayers(arrange.base, user)
  arrange.revision += 1
}

/** Scripted face state the tests arrange per case. */
export interface FaceArrangement {
  writable: boolean
  revision: number
  user: unknown
  value: unknown
  base?: unknown
  providers: ConfigurableProviderView[]
  /** Per-provider `llm.discoverModels` answer, or an error to reject with. */
  discoveries?: Record<string, readonly DiscoveredModelView[] | Error>
}

/** The official-catalog fixture the discovery seam answers for `openai`. */
export const CATALOG_MODELS: readonly DiscoveredModelView[] = [
  { id: 'gpt-5', name: 'GPT-5', contextWindow: 400000, maxTokens: 128000 },
  { id: 'gpt-5-mini', name: 'GPT-5 mini', contextWindow: 400000, maxTokens: 64000 },
]

/** Re-exported so the schema variants the specs compose arrive in a form the rehydrated walk consumes. */
export { Schema }

/** One models entry declaring both capability fields, built with the served serializer. */
export function modelsItemSchema(): Schema {
  return Schema.object({
    id: Schema.string(),
    name: Schema.string(),
    contextWindow: Schema.number(),
    maxTokens: Schema.number(),
    input: Schema.array(Schema.union(MODALITIES)),
    reasoningEfforts: Schema.union([
      Schema.const(false),
      Schema.dict(Schema.union([Schema.string(), Schema.const(null)]), Schema.union(REASONING_LEVELS)),
    ]),
  })
}

/** One `models` node wrapped in the full providers-dict serialized schema envelope. */
export function modelsEnvelope(models: unknown): unknown {
  return {
    type: 'object',
    dict: {
      providers: {
        type: 'dict',
        inner: { type: 'object', dict: { models } },
      },
    },
  }
}

/** The fixture llm-pi-ai namespace schema envelope, serialized by the real serializer. */
export function piAiSchema(entry: Schema = modelsItemSchema()): unknown {
  return Schema.object({
    providers: Schema.dict(Schema.object({
      apiKey: Schema.string(),
      baseURL: Schema.string(),
      models: Schema.array(entry),
      modelOverrides: Schema.dict(entry),
    })),
  }).toJSON()
}

/** The fixture llm-pi-ai namespace view. */
export function piAiNamespace(arrange: FaceArrangement): SettingsNamespaceView {
  // Presence semantics match the host: absent layers are OMITTED, never
  // written as present-`undefined` keys.
  return {
    ns: 'llm-pi-ai',
    schema: piAiSchema(),
    value: arrange.value,
    ...(arrange.base === undefined ? {} : { base: arrange.base }),
    ...(arrange.user === undefined ? {} : { user: arrange.user }),
    applies: 'live',
    secrets: [],
    revision: arrange.revision,
  }
}

/** One configurable directory entry. */
export function providerEntry(provider: string, declared: boolean, path = ['providers', provider], displayName?: string): ConfigurableProviderView {
  const display = displayName ?? (provider === 'ksyun' ? 'KSYun' : provider === 'ollama' ? 'Ollama' : provider)
  return {
    provider,
    displayName: display,
    settingsNs: 'llm-pi-ai',
    settingsPath: path,
    declared,
    active: true,
  }
}

/**
 * One openai catalog route arrangement: a baseURL-only profile by default;
 * pass `user: {}` for the dormant (unconfigured) shape.
 */
export function catalogArrangement(opts?: {
  /** User-layer override for the openai profile (pass `{}` for a dormant route). */
  user?: Record<string, unknown>
}): FaceArrangement {
  const arrange = defaultArrangement()
  arrange.user = opts?.user ?? { providers: { openai: { baseURL: 'https://proxy.test/v1' } } }
  arrange.value = arrange.user
  arrange.providers = [{ ...providerEntry('openai', false), displayName: 'OpenAI' }]
  arrange.discoveries = { openai: CATALOG_MODELS }
  return arrange
}

let next = 0

/** Wrap a business value in the envelope every Remote method actually returns. */
export function en<T>(value: T): RpcResponse<T> {
  next += 1
  // The carrier brands the wire id; the fixture mints one with the same shape.
  return { rpcId: `bmp-${next}` as RpcId, result: { ok: true, value } }
}

/** Scripted wire face producing the SERVED envelope shape on every call. */
export function scriptedFace(arrange: FaceArrangement): { api: IRemoteApi; mutates: RecordedMutate[] } {
  const mutates: RecordedMutate[] = []
  const api: IRemoteApi = {
    settings: {
      describe: (payload) => {
        assertEmptyPayload('settings.describe', payload)
        return Promise.resolve(en({
          writable: arrange.writable,
          hasDocument: true,
          namespaces: [piAiNamespace(arrange)],
        }))
      },
      mutate: payload => {
        mutates.push({ ns: payload.ns, ops: payload.ops, expectedRevision: payload.expectedRevision })
        if (payload.expectedRevision !== undefined && payload.expectedRevision !== arrange.revision) {
          return Promise.resolve(envelopeError('settings-conflict', `expected revision ${String(payload.expectedRevision)}, actual ${String(arrange.revision)}`))
        }
        applySettingsMutation(arrange, payload.ops)
        return Promise.resolve(en(piAiNamespace(arrange)))
      },
    },
    llm: {
      providers: (payload) => {
        assertEmptyPayload('llm.providers', payload)
        return Promise.resolve(en({ providers: arrange.providers }))
      },
      discoverModels: payload => {
        // The real seam answers catalog routes from the installed catalog;
        // the script answers exactly what the case arranged, or refuses
        // discovery for an unarranged provider the way a draft would fail.
        const answer = arrange.discoveries?.[payload.provider ?? '']
        if (answer instanceof Error) return Promise.reject(answer)
        if (answer === undefined) {
          return Promise.reject(new Error(`scriptedFace: no discovery arranged for ${String(payload.provider)}`))
        }
        return Promise.resolve(en({ models: [...answer] }))
      },
    },
  }
  return { api, mutates }
}

/** Envelope variant the tests construct for business-failure scenarios. */
export function envelopeError(code: 'internal' | 'settings-conflict', message: string): RpcResponse<never> {
  // RpcError is a closed discriminated union over (code, details) pairs —
  // control flow picks one real wire arm; no cast, no phantom pair.
  const error: RpcError = code === 'settings-conflict'
    ? { code, message, details: { ns: 'llm-pi-ai', expected: 1, actual: 2 } }
    : { code, message, details: {} }
  return { rpcId: `bmp-${++next}` as RpcId, result: { ok: false, error } }
}

/** The default arrangement: one declared provider with one model. */
export function defaultArrangement(): FaceArrangement {
  return {
    writable: true,
    revision: 1,
    user: {
      providers: {
        ksyun: {
          api: 'openai-completions',
          baseURL: 'http://example.test/v1',
          models: [{ id: 'Kimi-K3', name: 'Kimi' }],
        },
      },
    },
    value: {
      providers: {
        ksyun: {
          api: 'openai-completions',
          baseURL: 'http://example.test/v1',
          models: [{ id: 'Kimi-K3', name: 'Kimi' }],
        },
      },
    },
    providers: [providerEntry('ksyun', true)],
  }
}
