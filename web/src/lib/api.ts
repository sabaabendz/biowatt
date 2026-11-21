export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    // If running in development or standard docker port mapping
    if (window.location.port === "3000") {
      return `http://${window.location.hostname}:4000${cleanPath}`;
    }
  }
  return cleanPath;
}
