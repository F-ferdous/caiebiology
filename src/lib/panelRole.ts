// Which panel a shared manager component is rendered inside. Admin always has
// full access; assistants are gated by the live permissions doc.
export type PanelRole = "admin" | "assistant";
