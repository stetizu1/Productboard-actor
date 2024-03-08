export const isObject = (test: unknown): test is Record<string, unknown> => test !== null && typeof test === 'object';

export const isArrayOfObjects = (test: unknown): test is Array<Record<string, unknown>> => Array.isArray(test) && test.every(isObject);
