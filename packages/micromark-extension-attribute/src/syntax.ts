import type { Extension } from "micromark-util-types";
import { codes } from "micromark-util-symbol";
import { attributeFlow } from "./attribute-flow.ts";
import { attributeText } from "./attribute-text.ts";

/**
 * Create an extension for `micromark` to enable attribute syntax.
 *
 * @returns
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable attribute syntax.
 */
export function attribute(): Extension {
  return {
    text: { [codes.leftCurlyBrace]: attributeText },
    flow: { [codes.leftCurlyBrace]: attributeFlow },
  };
}
