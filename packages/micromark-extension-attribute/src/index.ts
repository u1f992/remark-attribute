export { attribute } from "./syntax.ts";

/**
 * Augment types.
 */
declare module "micromark-util-types" {
  /**
   * Token types.
   */
  interface TokenTypeMap {
    inlineAttributes: "inlineAttributes";
    inlineAttributesMarker: "inlineAttributesMarker";
    inlineAttribute: "inlineAttribute";
    inlineAttributeId: "inlineAttributeId";
    inlineAttributeIdMarker: "inlineAttributeIdMarker";
    inlineAttributeIdValue: "inlineAttributeIdValue";
    inlineAttributeClass: "inlineAttributeClass";
    inlineAttributeClassMarker: "inlineAttributeClassMarker";
    inlineAttributeClassValue: "inlineAttributeClassValue";
    inlineAttributeName: "inlineAttributeName";
    inlineAttributeInitializerMarker: "inlineAttributeInitializerMarker";
    inlineAttributeValueLiteral: "inlineAttributeValueLiteral";
    inlineAttributeValue: "inlineAttributeValue";
    inlineAttributeValueMarker: "inlineAttributeValueMarker";
    inlineAttributeValueData: "inlineAttributeValueData";

    blockAttributes: "blockAttributes";
    blockAttributesMarker: "blockAttributesMarker";
    blockAttribute: "blockAttribute";
    blockAttributeId: "blockAttributeId";
    blockAttributeIdMarker: "blockAttributeIdMarker";
    blockAttributeIdValue: "blockAttributeIdValue";
    blockAttributeClass: "blockAttributeClass";
    blockAttributeClassMarker: "blockAttributeClassMarker";
    blockAttributeClassValue: "blockAttributeClassValue";
    blockAttributeName: "blockAttributeName";
    blockAttributeInitializerMarker: "blockAttributeInitializerMarker";
    blockAttributeValueLiteral: "blockAttributeValueLiteral";
    blockAttributeValue: "blockAttributeValue";
    blockAttributeValueMarker: "blockAttributeValueMarker";
    blockAttributeValueData: "blockAttributeValueData";
  }
}
