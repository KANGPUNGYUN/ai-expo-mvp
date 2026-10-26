/** Prefixes runtime asset paths with Vite's base so the build also works under a sub-path. */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}
