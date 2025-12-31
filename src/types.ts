export type AllKeys<T> = T extends any ? keyof T : never;
export type AllVals<T> = T extends any ? T[keyof T] : never;

export type Writable<T> = {
  -readonly [K in keyof T]: T[K] extends object ? Writable<T[K]> : T[K];
};

export const isArray = (arg: unknown): arg is any[] | readonly any[] => {
  return Array.isArray(arg);
};
