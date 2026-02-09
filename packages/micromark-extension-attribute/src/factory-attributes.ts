import type { Code, Effects, State, TokenType } from "micromark-util-types";
import { ok as assert } from "devlop";
import { factorySpace } from "micromark-factory-space";
import { factoryWhitespace } from "micromark-factory-whitespace";
import {
  markdownLineEnding,
  markdownLineEndingOrSpace,
  markdownSpace,
  unicodePunctuation,
  unicodeWhitespace,
} from "micromark-util-character";
import { codes, types } from "micromark-util-symbol";

export function factoryAttributes(
  effects: Effects,
  ok: State,
  nok: State,
  attributesType: TokenType,
  attributesMarkerType: TokenType,
  attributeType: TokenType,
  attributeIdType: TokenType,
  attributeClassType: TokenType,
  attributeNameType: TokenType,
  attributeInitializerType: TokenType,
  attributeValueLiteralType: TokenType,
  attributeValueType: TokenType,
  attributeValueMarker: TokenType,
  attributeValueData: TokenType,
  disallowEol?: boolean | undefined,
): State {
  let type: TokenType;
  let marker: Code | undefined;

  return start;

  function start(code: Parameters<State>[0]): ReturnType<State> {
    assert(code === codes.leftCurlyBrace, "expected `{`");
    effects.enter(attributesType);
    effects.enter(attributesMarkerType);
    effects.consume(code);
    effects.exit(attributesMarkerType);
    return between;
  }

  function between(code: Parameters<State>[0]): ReturnType<State> {
    if (code === codes.numberSign) {
      type = attributeIdType;
      return shortcutStart(code);
    }

    if (code === codes.dot) {
      type = attributeClassType;
      return shortcutStart(code);
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, between, types.whitespace)(code);
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, between)(code);
    }

    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodeWhitespace(code) ||
      (unicodePunctuation(code) &&
        code !== codes.dash &&
        code !== codes.underscore)
    ) {
      return end(code);
    }

    effects.enter(attributeType);
    effects.enter(attributeNameType);
    effects.consume(code);
    return name;
  }

  function shortcutStart(code: Parameters<State>[0]): ReturnType<State> {
    // Assume it's registered.
    const markerType = (type + "Marker") as TokenType;
    effects.enter(attributeType);
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code);
    effects.exit(markerType);
    return shortcutStartAfter;
  }

  function shortcutStartAfter(code: Parameters<State>[0]): ReturnType<State> {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.numberSign ||
      code === codes.apostrophe ||
      code === codes.dot ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
    ) {
      return nok(code);
    }

    // Assume it's registered.
    const valueType = (type + "Value") as TokenType;
    effects.enter(valueType);
    effects.consume(code);
    return shortcut;
  }

  function shortcut(code: Parameters<State>[0]): ReturnType<State> {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code);
    }

    if (
      code === codes.numberSign ||
      code === codes.dot ||
      code === codes.rightCurlyBrace ||
      markdownLineEndingOrSpace(code)
    ) {
      // Assume it's registered.
      const valueType = (type + "Value") as TokenType;
      effects.exit(valueType);
      effects.exit(type);
      effects.exit(attributeType);
      return between(code);
    }

    effects.consume(code);
    return shortcut;
  }

  function name(code: Parameters<State>[0]): ReturnType<State> {
    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodeWhitespace(code) ||
      (unicodePunctuation(code) &&
        code !== codes.dash &&
        code !== codes.dot &&
        code !== codes.colon &&
        code !== codes.underscore)
    ) {
      effects.exit(attributeNameType);

      if (disallowEol && markdownSpace(code)) {
        return factorySpace(effects, nameAfter, types.whitespace)(code);
      }

      if (!disallowEol && markdownLineEndingOrSpace(code)) {
        return factoryWhitespace(effects, nameAfter)(code);
      }

      return nameAfter(code);
    }

    effects.consume(code);
    return name;
  }

  function nameAfter(code: Parameters<State>[0]): ReturnType<State> {
    if (code === codes.equalsTo) {
      effects.enter(attributeInitializerType);
      effects.consume(code);
      effects.exit(attributeInitializerType);
      return valueBefore;
    }

    // Attribute w/o value.
    effects.exit(attributeType);
    return between(code);
  }

  function valueBefore(code: Parameters<State>[0]): ReturnType<State> {
    if (
      code === codes.eof ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent ||
      code === codes.rightCurlyBrace ||
      (disallowEol && markdownLineEnding(code))
    ) {
      return nok(code);
    }

    if (code === codes.quotationMark || code === codes.apostrophe) {
      effects.enter(attributeValueLiteralType);
      effects.enter(attributeValueMarker);
      effects.consume(code);
      effects.exit(attributeValueMarker);
      marker = code;
      return valueQuotedStart;
    }

    if (disallowEol && markdownSpace(code)) {
      return factorySpace(effects, valueBefore, types.whitespace)(code);
    }

    if (!disallowEol && markdownLineEndingOrSpace(code)) {
      return factoryWhitespace(effects, valueBefore)(code);
    }

    effects.enter(attributeValueType);
    effects.enter(attributeValueData);
    effects.consume(code);
    marker = undefined;
    return valueUnquoted;
  }

  function valueUnquoted(code: Parameters<State>[0]): ReturnType<State> {
    if (
      code === codes.eof ||
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.lessThan ||
      code === codes.equalsTo ||
      code === codes.greaterThan ||
      code === codes.graveAccent
    ) {
      return nok(code);
    }

    if (code === codes.rightCurlyBrace || markdownLineEndingOrSpace(code)) {
      effects.exit(attributeValueData);
      effects.exit(attributeValueType);
      effects.exit(attributeType);
      return between(code);
    }

    effects.consume(code);
    return valueUnquoted;
  }

  function valueQuotedStart(code: Parameters<State>[0]): ReturnType<State> {
    if (code === marker) {
      effects.enter(attributeValueMarker);
      effects.consume(code);
      effects.exit(attributeValueMarker);
      effects.exit(attributeValueLiteralType);
      effects.exit(attributeType);
      return valueQuotedAfter;
    }

    effects.enter(attributeValueType);
    return valueQuotedBetween(code);
  }

  function valueQuotedBetween(code: Parameters<State>[0]): ReturnType<State> {
    if (code === marker) {
      effects.exit(attributeValueType);
      return valueQuotedStart(code);
    }

    if (code === codes.eof) {
      return nok(code);
    }

    // Note: blank lines can't exist in content.
    if (markdownLineEnding(code)) {
      return disallowEol
        ? nok(code)
        : factoryWhitespace(effects, valueQuotedBetween)(code);
    }

    effects.enter(attributeValueData);
    effects.consume(code);
    return valueQuoted;
  }

  function valueQuoted(code: Parameters<State>[0]): ReturnType<State> {
    if (code === marker || code === codes.eof || markdownLineEnding(code)) {
      effects.exit(attributeValueData);
      return valueQuotedBetween(code);
    }

    effects.consume(code);
    return valueQuoted;
  }

  function valueQuotedAfter(code: Parameters<State>[0]): ReturnType<State> {
    return code === codes.rightCurlyBrace || markdownLineEndingOrSpace(code)
      ? between(code)
      : end(code);
  }

  function end(code: Parameters<State>[0]): ReturnType<State> {
    if (code === codes.rightCurlyBrace) {
      effects.enter(attributesMarkerType);
      effects.consume(code);
      effects.exit(attributesMarkerType);
      effects.exit(attributesType);
      return ok;
    }

    return nok(code);
  }
}
