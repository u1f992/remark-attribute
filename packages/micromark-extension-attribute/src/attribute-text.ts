import type {
  Construct,
  State,
  TokenizeContext,
  Tokenizer,
} from "micromark-util-types";
import { codes } from "micromark-util-symbol";
import { factoryAttributes } from "./factory-attributes.js";

export const attributeText: Construct = { tokenize: tokenizeAttributeText };

function tokenizeAttributeText(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Parameters<State>[0]): ReturnType<State> {
    if (code !== codes.leftCurlyBrace) throw new Error("expected `{`");
    return factoryAttributes(
      effects,
      ok,
      nok,
      "inlineAttributes",
      "inlineAttributesMarker",
      "inlineAttribute",
      "inlineAttributeId",
      "inlineAttributeClass",
      "inlineAttributeName",
      "inlineAttributeInitializerMarker",
      "inlineAttributeValueLiteral",
      "inlineAttributeValue",
      "inlineAttributeValueMarker",
      "inlineAttributeValueData",
      true,
    )(code);
  }
}
