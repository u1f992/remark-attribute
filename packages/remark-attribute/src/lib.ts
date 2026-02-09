import type {Processor} from 'unified'
import {attributeFromMarkdown} from 'mdast-util-attribute'
import type {Options} from 'mdast-util-attribute'
import {attribute} from 'micromark-extension-attribute'

/**
 * Add support for attributes (`{#id .class key=value}`).
 *
 * @param options
 *   Configuration (optional).
 * @returns
 *   Nothing.
 */
export default function remarkAttribute(
  this: Processor,
  options?: Options | null | undefined
): undefined {
  const data = this.data() as Record<string, unknown>

  const micromarkExtensions =
    (data.micromarkExtensions as unknown[]) ||
    (data.micromarkExtensions = [] as unknown[])
  const fromMarkdownExtensions =
    (data.fromMarkdownExtensions as unknown[]) ||
    (data.fromMarkdownExtensions = [] as unknown[])

  micromarkExtensions.push(attribute())
  fromMarkdownExtensions.push(attributeFromMarkdown(options))
}
