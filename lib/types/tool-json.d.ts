/** Omit optional object properties, but reject values JSON would silently corrupt. */
export declare function toolJson(value: unknown, seen?: Set<object>): unknown;
