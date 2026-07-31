// Encodes/decodes a list of schedule keys into a URL-safe string, entirely
// client-side — no server storage. The link itself is the source of truth.

function toBase64Url(input: string): string {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
}

export function encodeSelection(keys: string[]): string {
    return toBase64Url(JSON.stringify(keys));
}

export function decodeSelection(param: string | null): string[] {
    if (!param) return [];

    try {
        const parsed = JSON.parse(fromBase64Url(param));
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((k): k is string => typeof k === 'string');
    } catch {
        return [];
    }
}
