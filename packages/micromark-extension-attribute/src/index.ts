export { attribute } from "./syntax.ts";

import type { inlineTokenTypes, blockTokenTypes } from "./token-types.ts";

type TokenSelfMap<T extends Record<string, string>> = {
  [K in T[keyof T]]: K;
};

declare module "micromark-util-types" {
  interface TokenTypeMap
    extends
      TokenSelfMap<typeof inlineTokenTypes>,
      TokenSelfMap<typeof blockTokenTypes> {}
}
