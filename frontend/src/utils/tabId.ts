import { v4 as uuidv4 } from 'uuid';

const TAB_ID_STORAGE_KEY = 'hms_tab_id';

// Generate a unique tab ID for this browser tab
export function generateTabId(): string {
  return uuidv4().substring(0, 8); // Short, unique identifier
}

// Get or create tab ID for current tab
export function getOrCreateTabId(): string {
  // Try to get existing tab ID from sessionStorage (tab-specific)
  let tabId = sessionStorage.getItem(TAB_ID_STORAGE_KEY);
  
  if (!tabId) {
    // Generate new tab ID and store it
    tabId = generateTabId();
    sessionStorage.setItem(TAB_ID_STORAGE_KEY, tabId);
  }
  
  return tabId;
}

// Get current tab ID (without creating new one)
export function getCurrentTabId(): string | null {
  return sessionStorage.getItem(TAB_ID_STORAGE_KEY);
}

// Clear tab ID (for logout)
export function clearTabId(): void {
  sessionStorage.removeItem(TAB_ID_STORAGE_KEY);
}

// Check if tab ID exists
export function hasTabId(): boolean {
  return !!sessionStorage.getItem(TAB_ID_STORAGE_KEY);
}