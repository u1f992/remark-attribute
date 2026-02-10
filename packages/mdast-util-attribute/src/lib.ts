import type {
  CompileContext,
  Extension as FromMarkdownExtension,
  Token,
} from "mdast-util-from-markdown";
import type {
  Heading,
  Nodes,
  Paragraph,
  Parent,
  PhrasingContent,
  Root,
  RootContent,
  Text,
} from "mdast";
import type { Position } from "unist";
import { htmlElementAttributes as htmlElemAttr } from "html-element-attributes";
import { parseEntities } from "parse-entities";
import { visitParents } from "unist-util-visit-parents";
// Load Data.hProperties augmentation from mdast-util-to-hast
import type {} from "mdast-util-to-hast";

declare module "mdast-util-from-markdown" {
  interface CompileData {
    attributeList?: Array<[string, string]> | undefined;
  }
}

interface AttributeInline {
  type: "attributeInline";
  attributes: Record<string, string>;
  children: [];
  data?: Record<string, unknown> | undefined;
  position?: Position | undefined;
}

interface AttributeBlock {
  type: "attributeBlock";
  attributes: Record<string, string>;
  children: [];
  data?: Record<string, unknown> | undefined;
  position?: Position | undefined;
}

declare module "mdast" {
  interface RootContentMap {
    attributeBlock: AttributeBlock;
    attributeInline: AttributeInline;
  }
  interface PhrasingContentMap {
    attributeInline: AttributeInline;
  }
}

const domEventHandlers = [
  "onabort",
  "onautocomplete",
  "onautocompleteerror",
  "onblur",
  "oncancel",
  "oncanplay",
  "oncanplaythrough",
  "onchange",
  "onclick",
  "onclose",
  "oncontextmenu",
  "oncuechange",
  "ondblclick",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragexit",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onfocus",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onmousedown",
  "onmouseenter",
  "onmouseleave",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onmousewheel",
  "onpause",
  "onplay",
  "onplaying",
  "onprogress",
  "onratechange",
  "onreset",
  "onresize",
  "onscroll",
  "onseeked",
  "onseeking",
  "onselect",
  "onshow",
  "onsort",
  "onstalled",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "onvolumechange",
  "onwaiting",
];

/** mdast node type → HTML tag name */
const convTypeTag: Record<string, string> = {
  image: "img",
  link: "a",
  heading: "h1",
  strong: "strong",
  emphasis: "em",
  delete: "s",
  inlineCode: "code",
  code: "code",
  linkReference: "a",
  "*": "*",
};

export interface Options {
  allowDangerousDOMEventHandlers?: boolean;
  extend?: Record<string, string[]>;
  scope?: "none" | "global" | "specific" | "extended" | "permissive" | "every";
  enableAtxHeaderInline?: boolean;
  disableBlockElements?: boolean;
}

interface Config {
  allowDangerousDOMEventHandlers: boolean;
  extend: Record<string, string[]>;
  scope: string;
  enableAtxHeaderInline: boolean;
  disableBlockElements: boolean;
}

const emptyOptions: Readonly<Options> = {};

/**
 * Create an extension for `mdast-util-from-markdown` to enable attributes.
 */
export function attributeFromMarkdown(
  options?: Readonly<Options> | null | undefined,
): FromMarkdownExtension {
  const config: Config = {
    allowDangerousDOMEventHandlers: false,
    extend: {},
    scope: "extended",
    enableAtxHeaderInline: true,
    disableBlockElements: false,
    ...emptyOptions,
    ...options,
  };

  return {
    enter: {
      inlineAttributes: enterInlineAttributes,
      blockAttributes: enterBlockAttributes,
    },
    exit: {
      inlineAttributeIdValue: exitAttributeIdValue,
      inlineAttributeClassValue: exitAttributeClassValue,
      inlineAttributeName: exitAttributeName,
      inlineAttributeValue: exitAttributeValue,
      inlineAttributes: exitInlineAttributes,

      blockAttributeIdValue: exitAttributeIdValue,
      blockAttributeClassValue: exitAttributeClassValue,
      blockAttributeName: exitAttributeName,
      blockAttributeValue: exitAttributeValue,
      blockAttributes: exitBlockAttributes,
    },
    transforms: [transformAttributes],
  };

  function enterInlineAttributes(
    this: CompileContext,
    token: Token,
  ): undefined {
    this.data.attributeList = [];
    this.enter(
      { type: "attributeInline", attributes: {}, children: [] },
      token,
    );
    this.buffer();
  }

  function enterBlockAttributes(this: CompileContext, token: Token): undefined {
    this.data.attributeList = [];
    this.enter({ type: "attributeBlock", attributes: {}, children: [] }, token);
    this.buffer();
  }

  function exitAttributeIdValue(this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    list.push([
      "id",
      parseEntities(this.sliceSerialize(token), { attribute: true }),
    ]);
  }

  function exitAttributeClassValue(
    this: CompileContext,
    token: Token,
  ): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    list.push([
      "class",
      parseEntities(this.sliceSerialize(token), { attribute: true }),
    ]);
  }

  function exitAttributeName(this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    list.push([this.sliceSerialize(token), ""]);
  }

  function exitAttributeValue(this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    const last = list[list.length - 1];
    if (!last) throw new Error("expected attribute entry");
    last[1] = parseEntities(this.sliceSerialize(token), {
      attribute: true,
    });
  }

  function exitInlineAttributes(this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    const cleaned = cleanAttributes(list);
    this.data.attributeList = undefined;
    this.resume();
    const node = this.stack[this.stack.length - 1];
    if (!node || node.type !== "attributeInline")
      throw new Error("expected `attributeInline`");
    node.attributes = cleaned;
    this.exit(token);
  }

  function exitBlockAttributes(this: CompileContext, token: Token): undefined {
    const list = this.data.attributeList;
    if (!list) throw new Error("expected `attributeList`");
    const cleaned = cleanAttributes(list);
    this.data.attributeList = undefined;
    this.resume();
    const node = this.stack[this.stack.length - 1];
    if (!node || node.type !== "attributeBlock")
      throw new Error("expected `attributeBlock`");
    node.attributes = cleaned;
    this.exit(token);
  }

  /**
   * Transform the tree to attach attribute nodes to their targets.
   */
  function transformAttributes(tree: Root): void {
    // Handle fenced code meta first
    visitParents(tree, "code", function (node) {
      if (node.meta) {
        const attributes = parseMeta(node.meta);
        if (attributes && Object.keys(attributes).length > 0) {
          assignAttributes(node, attributes, config);
        }
      }
    });

    // Handle block attributes (in root children / flow level)
    if (!config.disableBlockElements) {
      handleBlockAttributes(tree, config);
    }

    // Handle inline attributes (in paragraph children / phrasing level)
    handleInlineAttributes(tree, config);
  }
}

/**
 * Clean raw attribute list into a map, merging classes.
 */
function cleanAttributes(
  list: Array<[string, string]>,
): Record<string, string> {
  const cleaned: Record<string, string> = {};
  let index = -1;

  while (++index < list.length) {
    const attribute = list[index];
    if (!attribute) throw new Error("unreachable");
    if (attribute[0] === "class" && cleaned.class) {
      cleaned.class += " " + attribute[1];
    } else {
      cleaned[attribute[0]] = attribute[1];
    }
  }

  return cleaned;
}

/**
 * Handle block-level attribute nodes.
 * Block attributes appear as direct children of root, after headings etc.
 */
function handleBlockAttributes(tree: Root, config: Config): void {
  let index = tree.children.length - 1;

  while (index >= 0) {
    const node = tree.children[index];

    if (node && node.type === "attributeBlock") {
      // Look for preceding sibling to attach to
      let targetIndex = index - 1;
      while (
        targetIndex >= 0 &&
        tree.children[targetIndex]?.type === "attributeBlock"
      ) {
        targetIndex--;
      }

      const target = targetIndex >= 0 ? tree.children[targetIndex] : undefined;

      if (target && isBlockTarget(target)) {
        assignAttributes(target, node.attributes, config);
        tree.children.splice(index, 1);
      } else {
        // Unattached: convert to paragraph with literal text
        tree.children[index] = createFallbackParagraph(node);
      }
    }

    index--;
  }
}

/**
 * Check if a node is a valid block attribute target.
 */
function isBlockTarget(node: RootContent): boolean {
  return (
    node.type === "heading" ||
    node.type === "paragraph" ||
    node.type === "code" ||
    node.type === "blockquote" ||
    node.type === "list" ||
    node.type === "table" ||
    node.type === "thematicBreak"
  );
}

/**
 * Handle inline attribute nodes within paragraphs and headings.
 */
function handleInlineAttributes(tree: Root, config: Config): void {
  visitParents(tree, function (node) {
    if (!("children" in node)) return;
    const parent = node as Parent;

    // Only process containers that have phrasing content
    if (
      parent.type !== "paragraph" &&
      parent.type !== "heading" &&
      parent.type !== "link" &&
      parent.type !== "emphasis" &&
      parent.type !== "strong" &&
      parent.type !== "delete" &&
      parent.type !== "linkReference"
    ) {
      return;
    }

    let index = parent.children.length - 1;

    while (index >= 0) {
      const child = parent.children[index];

      if (child && child.type === "attributeInline") {
        // Case 2: Inside a heading — attach to heading itself
        if (
          parent.type === "heading" &&
          config.enableAtxHeaderInline !== false
        ) {
          const handled = handleHeadingInlineAttribute(
            parent as Heading,
            index,
            config,
          );
          if (handled) {
            index--;
            continue;
          }
        }

        // Case 1: Inline — attach to preceding sibling
        const target = index > 0 ? parent.children[index - 1] : undefined;

        if (target && isInlineTarget(target as PhrasingContent)) {
          assignAttributes(target, child.attributes, config);
          parent.children.splice(index, 1);

          // Trim trailing whitespace from preceding text if needed
        } else {
          // Unattached: convert to text
          parent.children[index] = createFallbackText(child);
        }
      }

      index--;
    }
  });
}

/**
 * Handle attribute inline inside a heading (e.g. `# Title {.class}`).
 * The attribute applies to the heading itself.
 */
function handleHeadingInlineAttribute(
  heading: Heading,
  attrIndex: number,
  config: Config,
): boolean {
  const attr = heading.children[attrIndex];
  if (!attr || attr.type !== "attributeInline") return false;

  // Only handle if it's the last meaningful child
  // Check that nothing follows except whitespace text
  let isLast = true;
  for (let i = attrIndex + 1; i < heading.children.length; i++) {
    const sibling = heading.children[i];
    if (!sibling || sibling.type !== "text" || sibling.value.trim() !== "") {
      isLast = false;
      break;
    }
  }

  if (!isLast) return false;

  // Don't apply if heading ONLY contains the attribute (e.g. `# {.class}`)
  let hasContentBefore = false;
  for (let i = 0; i < attrIndex; i++) {
    const sibling = heading.children[i];
    if (!sibling || sibling.type !== "text" || sibling.value.trim() !== "") {
      hasContentBefore = true;
      break;
    }
  }

  if (!hasContentBefore) return false;

  // Apply to heading
  assignAttributes(heading, attr.attributes, config);

  // Remove attribute node and any trailing whitespace nodes
  heading.children.splice(attrIndex, heading.children.length - attrIndex);

  // Trim trailing whitespace from the last remaining text child
  const lastChild = heading.children[heading.children.length - 1];
  if (lastChild && lastChild.type === "text") {
    lastChild.value = lastChild.value.replace(/\s+$/, "");
  }

  return true;
}

/**
 * Check if a node is a valid inline attribute target.
 */
function isInlineTarget(node: PhrasingContent): boolean {
  return (
    node.type === "strong" ||
    node.type === "emphasis" ||
    node.type === "link" ||
    node.type === "image" ||
    node.type === "inlineCode" ||
    node.type === "delete" ||
    node.type === "linkReference"
  );
}

/**
 * Assign attributes to a node as `data.hProperties`, with filtering.
 */
function assignAttributes(
  node: Nodes,
  attributes: Record<string, string>,
  config: Config,
): void {
  if (!attributes || Object.keys(attributes).length === 0) return;

  const nodeType = node.type;
  const htmlTag = convTypeTag[nodeType] || "*";

  let filtered: Record<string, string>;
  if (config.scope && config.scope !== "none") {
    filtered = filterAttributes({ ...attributes }, config, htmlTag);
  } else {
    return; // scope=none means disabled
  }

  if (Object.keys(filtered).length === 0) return;

  const data = node.data || (node.data = {});
  const existing: Record<string, string> =
    (data.hProperties as Record<string, string> | undefined) ?? {};

  // Merge: class values get concatenated, others overwritten
  for (const [key, value] of Object.entries(filtered)) {
    const prev = existing[key];
    if (key === "class" && prev) {
      existing[key] = prev + " " + value;
    } else {
      existing[key] = value;
    }
  }

  data.hProperties = existing;
}

/**
 * Filter attributes based on scope configuration.
 * Ported from old remark-attr.
 */
function filterAttributes(
  prop: Record<string, string>,
  config: Config,
  type: string,
): Record<string, string> {
  const { scope, extend, allowDangerousDOMEventHandlers } = config;
  const specific = htmlElemAttr as unknown as Record<string, string[]>;

  // Build extend tag map (mdast type → html tag)
  const extendTag: Record<string, string[]> = {};
  if (extend && typeof extend === "object") {
    for (const p of Object.keys(extend)) {
      const tag = convTypeTag[p] || p;
      extendTag[tag] = extend[p] ?? [];
    }
  }

  // Delete empty non-special keys
  for (const p of Object.keys(prop)) {
    if (p !== "key" && p !== "class" && p !== "id") {
      prop[p] = prop[p] ?? "";
    }
  }

  const isDangerous = (p: string) => domEventHandlers.includes(p);
  const isSpecific = (p: string) =>
    type in specific && (specific[type]?.includes(p) ?? false);
  const isGlobal = (p: string) =>
    (specific["*"]?.includes(p) ?? false) ||
    /^aria-[a-z][a-z.\-_\d]*$/.test(p) ||
    /^data-[a-z][a-z_.\-0-9]*$/.test(p);

  let inScope: (p: string) => boolean = () => false;

  const orFunc =
    (fun: (p: string) => boolean, fun2: (p: string) => boolean) =>
    (x: string) =>
      fun(x) || fun2(x);

  switch (scope) {
    case "none":
      break;
    case "permissive":
    case "every":
      if (allowDangerousDOMEventHandlers) {
        inScope = () => true;
      } else {
        inScope = (x: string) => !isDangerous(x);
      }

      break;
    case "extended":
    default:
      inScope = (p: string) =>
        Boolean(extendTag && type in extendTag && extendTag[type]?.includes(p));
      inScope = orFunc(inScope, (p: string) =>
        Boolean("*" in extendTag && extendTag["*"]?.includes(p)),
      );
    // Falls through
    case "specific":
      inScope = orFunc(inScope, isSpecific);
    // Falls through
    case "global":
      inScope = orFunc(inScope, isGlobal);
      if (allowDangerousDOMEventHandlers) {
        inScope = orFunc(inScope, isDangerous);
      }
  }

  for (const p of Object.keys(prop)) {
    if (!inScope(p)) {
      delete prop[p];
    }
  }

  return prop;
}

/**
 * Parse fenced code meta string into attributes.
 * Supports both `info=string` and `{info=string}` forms.
 */
function parseMeta(meta: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!meta) return result;

  // Strip outer braces if present
  let str = meta.trim();
  if (str.startsWith("{") && str.endsWith("}")) {
    str = str.slice(1, -1).trim();
  }

  // Simple key=value parser
  let i = 0;
  while (i < str.length) {
    // Skip whitespace
    while (i < str.length && /\s/.test(str.charAt(i))) i++;
    if (i >= str.length) break;

    // Handle #id shortcut
    if (str.charAt(i) === "#") {
      i++;
      let value = "";
      while (i < str.length && !/[\s}]/.test(str.charAt(i))) {
        value += str.charAt(i);
        i++;
      }

      if (value) result.id = value;
      continue;
    }

    // Handle .class shortcut
    if (str.charAt(i) === ".") {
      i++;
      let value = "";
      while (i < str.length && !/[\s.#}]/.test(str.charAt(i))) {
        value += str.charAt(i);
        i++;
      }

      if (value) {
        result.class = result.class ? result.class + " " + value : value;
      }

      continue;
    }

    // Read key
    let key = "";
    while (i < str.length && !/[\s=}]/.test(str.charAt(i))) {
      key += str.charAt(i);
      i++;
    }

    if (!key) {
      i++;
      continue;
    }

    // Check for =
    if (i < str.length && str.charAt(i) === "=") {
      i++;
      let value = "";

      if (i < str.length && (str.charAt(i) === '"' || str.charAt(i) === "'")) {
        const quote = str.charAt(i);
        i++;
        while (i < str.length && str.charAt(i) !== quote) {
          value += str.charAt(i);
          i++;
        }

        if (i < str.length) i++; // skip closing quote
      } else {
        while (i < str.length && !/[\s}]/.test(str.charAt(i))) {
          value += str.charAt(i);
          i++;
        }
      }

      result[key] = value;
    } else {
      result[key] = "";
    }
  }

  return result;
}

/**
 * Serialize attributes back to text for fallback.
 */
function serializeAttributes(attributes: Record<string, string>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "id") {
      parts.push("#" + value);
    } else if (key === "class") {
      for (const cls of value.split(/\s+/)) {
        if (cls) parts.push("." + cls);
      }
    } else if (value) {
      parts.push(key + '="' + value + '"');
    } else {
      parts.push(key);
    }
  }

  return "{" + parts.join(" ") + "}";
}

/**
 * Create a fallback paragraph node from an unattached block attribute.
 */
function createFallbackParagraph(node: AttributeBlock): Paragraph {
  return {
    type: "paragraph",
    children: [{ type: "text", value: serializeAttributes(node.attributes) }],
    position: node.position,
  };
}

/**
 * Create a fallback text node from an unattached inline attribute.
 */
function createFallbackText(node: AttributeInline): Text {
  return {
    type: "text",
    value: serializeAttributes(node.attributes),
    position: node.position,
  };
}
