/**
 * Host half of better-model-provider. The plugin is UI-only: every fact it
 * edits reaches the host through the existing settings/llm wire remotes, so
 * this row exists only to keep the package mounted while the browser
 * composes its client bundle.
 *
 * @module better-model-provider
 */

/** Stable plugin id, matching the cordis.patch.yml row. */
export const name = 'better-model-provider'

/**
 * Mount nothing: no services, tools, or events. The dispose contract is
 * satisfied by returning void, exactly as documented for a keepalive row.
 */
export function apply(): void {}
