import type { sr } from './sr.ts';

// Serbian is the reference shape; every language must provide the same keys and call signatures.
type Widen<T> = T extends string ? string
  : T extends (...args: infer A) => infer R ? (...args: A) => Widen<R>
  : T extends readonly (infer U)[] ? readonly Widen<U>[]
  : { readonly [K in keyof T]: Widen<T[K]> };
export type Copy = Widen<typeof sr>;
