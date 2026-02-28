export function parseBool(val: unknown, defaultValue = true) {
    if (typeof val === "string") return val.toLowerCase() !== "false";
    if (typeof val === "boolean") return val;
    return defaultValue;
}

export function ensureHash(color: string) {
    if (!color) return color;
    return color.startsWith("#") ? color : `#${color}`;
}
