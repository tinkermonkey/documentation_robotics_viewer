export function isValidHttpUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Must start with http:// or https://
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return false;
  }

  // Must have at least a host after the protocol
  try {
    const urlObj = new URL(url);
    // URL constructor validates syntax and hostname
    return !!urlObj.hostname;
  } catch {
    return false;
  }
}

export function constructSafeUrl(baseUrl: string, ...pathParts: string[]): string | null {
  if (!isValidHttpUrl(baseUrl)) {
    return null;
  }

  try {
    const url = new URL(baseUrl);

    // Build the pathname by appending path parts
    const parts = pathParts
      .filter(part => part && part.trim())
      .map(part => part.replace(/^\/+/, '').replace(/\/+$/, ''));

    if (parts.length > 0) {
      // Ensure pathname ends with / before appending new parts
      if (url.pathname && !url.pathname.endsWith('/')) {
        url.pathname += '/';
      }
      url.pathname += parts.join('/');
    }

    return url.toString();
  } catch {
    // URL constructor throws if the input is invalid
    return null;
  }
}
