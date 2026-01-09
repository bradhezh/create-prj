export const isArray = (arg: unknown): arg is any[] | readonly any[] => {
  return Array.isArray(arg);
};

export type DeepWritable<T> =
  T extends ReadonlyArray<infer E>
    ? DeepWritable<E>[]
    : T extends object
      ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
      : T;
export type DeepReadonly<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonly<E>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type AllKeys<T> = T extends any ? keyof T : never;
export type AllVals<T> = T extends any ? T[keyof T] : never;

export type Optional<T, K extends keyof T> = {
  [K0 in keyof T as K0 extends K ? never : K0]: T[K0];
} & { [K0 in K]: { [K1 in keyof T[K0]]?: T[K0][K1] } };

export type Flatten<T, K extends keyof T> = {
  [K0 in keyof T as K0 extends K ? never : K0]: T[K0];
} & (T extends { [K0 in K]: unknown }
  ? { [K0 in keyof T[K]]: T[K][K0] }
  : unknown);

export type ConfFromOption<T> = T extends number | string | boolean | unknown[]
  ? T
  : T[keyof T] extends number | string | boolean | unknown[]
    ? T[keyof T]
    : { [K in keyof T]: ConfFromOption<T[K]> };
