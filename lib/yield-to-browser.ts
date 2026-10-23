/** Give scrolling and painting a turn between small scene-preparation tasks. */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    // globalThis also works in the worker bundle (Next folds `typeof window`
    // branches in client builds, including modules shared with a worker).
    if (typeof globalThis.requestIdleCallback === "function") {
      globalThis.requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
