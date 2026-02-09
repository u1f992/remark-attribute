import type {
  Construct,
  State,
  TokenizeContext,
  Tokenizer,
} from "micromark-util-types";
import { ok as assert } from "devlop";
import { factorySpace } from "micromark-factory-space";
import { markdownLineEnding } from "micromark-util-character";
import { codes, types } from "micromark-util-symbol";
import { factoryAttributes } from "./factory-attributes.js";

export const attributeFlow: Construct = { tokenize: tokenizeAttributeFlow };

function tokenizeAttributeFlow(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Parameters<State>[0]): ReturnType<State> {
    assert(code === codes.leftCurlyBrace, "expected `{`");
    return factoryAttributes(
      effects,
      afterAttributes,
      nok,
      "blockAttributes",
      "blockAttributesMarker",
      "blockAttribute",
      "blockAttributeId",
      "blockAttributeClass",
      "blockAttributeName",
      "blockAttributeInitializerMarker",
      "blockAttributeValueLiteral",
      "blockAttributeValue",
      "blockAttributeValueMarker",
      "blockAttributeValueData",
      true,
    )(code);
  }

  function afterAttributes(code: Parameters<State>[0]): ReturnType<State> {
    return factorySpace(effects, end, types.whitespace)(code);
  }

  function end(code: Parameters<State>[0]): ReturnType<State> {
    if (code === codes.eof || markdownLineEnding(code)) {
      return ok(code);
    }

    return nok(code);
  }
}
