/**
 * The section's stylesheet, injected as one plugin-owned `<style>` element
 * for the fiber lifetime. Class names carry the `bmp-` prefix so no official
 * stylesheet collides with them; every color and radius rides the shell's
 * design tokens so the section skins with every theme.
 *
 * @module better-model-provider/styles
 */

/** One styletext for the whole section. */
export const STYLES = `
.bmp-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bmp-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.bmp-muted {
  margin: 0;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 13px;
  line-height: 1.5;
}
.bmp-empty,
.bmp-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}
.bmp-empty {
  gap: 4px;
  padding: 24px;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
}
.bmp-emptyTitle {
  font-weight: 600;
}
.bmp-card {
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
}
.bmp-cardHeader {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.bmp-cardTitle {
  font-weight: 600;
}
.bmp-cardMeta {
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  font-size: 12px;
}
.bmp-tag,
.bmp-staged {
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.bmp-tag {
  background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
}
.bmp-modelRow {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  padding-top: 6px;
}
.bmp-modelMain {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bmp-modelId {
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  word-break: break-all;
}
.bmp-modelName {
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
  font-size: 12px;
}
.bmp-staged {
  background: var(--dsw-alias-state-warn-tertiary, rgba(240, 160, 0, 0.15));
  color: var(--dsw-alias-state-warn-primary, #a06800);
}
.bmp-modelMain .bmp-icon {
  margin-left: auto;
}
.bmp-modelAdvanced {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 0 4px;
}
.bmp-block,
.bmp-models {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bmp-blockLabel {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
}
.bmp-capacityGrid,
.bmp-modeGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.bmp-capacityField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bmp-officialHint {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
}
.bmp-catalogBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 8px;
}
.bmp-dormant {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.bmp-dormantList {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 260px;
  overflow-y: auto;
}
.bmp-dormantRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--dsh-border);
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
}
.bmp-dormantRow:hover,
.bmp-dormantRow[aria-expanded="true"] {
  background-color: color-mix(in srgb, currentColor 6%, transparent);
}
.bmp-toggle,
.bmp-msItemCheck {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.bmp-toggle {
  font-size: 13px;
}
.bmp-modeGrid {
  align-items: center;
}
.bmp-modeGrid .bmp-select {
  max-width: none;
  width: 100%;
}
.bmp-modalityRow {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 30px;
  flex-wrap: wrap;
}
.bmp-msWrap {
  position: relative;
}
.bmp-msButton {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.bmp-msPanel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  max-height: 240px;
  overflow: auto;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.bmp-msItem {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: 4px;
  font-size: 13px;
}
.bmp-msItem:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
}
.bmp-msItemCheck {
  cursor: pointer;
}
.bmp-msWire {
  padding: 2px 6px;
  font-size: 12px;
}
.bmp-select,
.bmp-input {
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1, #fff);
  color: inherit;
  font-size: 13px;
}
.bmp-select {
  max-width: 280px;
  padding: 6px 8px;
}
.bmp-input {
  padding: 4px 8px;
}
.bmp-input:disabled,
.bmp-select:disabled,
.bmp-button:disabled {
  opacity: 0.6;
}
.bmp-rowActions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.bmp-button {
  padding: 6px 12px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-3, rgba(0, 0, 0, 0.06));
  color: inherit;
  font-size: 13px;
  cursor: pointer;
}
.bmp-button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.1));
}
.bmp-button:disabled {
  cursor: default;
}
.bmp-link {
  border: none;
  background: none;
  padding: 0;
  color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.65));
  font-size: 12px;
  cursor: pointer;
}
.bmp-link:hover:not(:disabled) {
  text-decoration: underline;
}
.bmp-danger {
  color: var(--dsw-alias-state-error-primary, #c0342b);
  font-weight: 600;
}
.bmp-error {
  padding: 8px;
  border-radius: 6px;
  /* No soft-error token exists in the platform palette; a translucent red
     overlay alpha-blends acceptably on both themes. */
  background: rgba(192, 52, 43, 0.12);
  color: var(--dsw-alias-state-error-primary, #c0342b);
  font-size: 12px;
  word-break: break-word;
}
.bmp-icon {
  border: none;
  background: none;
  padding: 4px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
  cursor: pointer;
  border-radius: 4px;
  line-height: 0;
}
.bmp-icon:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: inherit;
}
`
