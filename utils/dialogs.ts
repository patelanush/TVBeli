export function confirmAction(title: string, message: string): boolean {
  return window.confirm(`${title}\n\n${message}`);
}

export function showMessage(title: string, message: string): void {
  window.alert(`${title}\n\n${message}`);
}
