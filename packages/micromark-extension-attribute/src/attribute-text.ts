import type {
  Construct,
  State,
  TokenizeContext,
  Tokenizer,
} from "micromark-util-types";
import { codes } from "micromark-util-symbol";
import { factoryAttributes } from "./factory-attributes.js";
import { inlineTokenTypes as t } from "./token-types.ts";

export const attributeText: Construct = { tokenize: tokenizeAttributeText };

function tokenizeAttributeText(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Parameters<State>[0]): ReturnType<State> {
    if (code !== codes.leftCurlyBrace) return nok(code);
    return factoryAttributes(
      effects,
      ok,
      nok,
      t.attributes,
      t.attributesMarker,
      t.attribute,
      t.attributeId,
      t.attributeClass,
      t.attributeName,
      t.attributeInitializerMarker,
      t.attributeValueLiteral,
      t.attributeValue,
      t.attributeValueMarker,
      t.attributeValueData,
      true,
    )(code);
  }
}
