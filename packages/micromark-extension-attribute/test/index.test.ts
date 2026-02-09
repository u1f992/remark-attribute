import assert from "node:assert/strict";
import test from "node:test";
import { micromark } from "micromark";
import { attribute } from "../src/index.ts";

function m(input: string): string {
  return micromark(input, { extensions: [attribute()] });
}

test("micromark-extension-attribute (core)", async function (t) {
  await t.test("should expose the public api", async function () {
    assert.deepEqual(Object.keys(await import("../src/index.ts")).sort(), [
      "attribute",
    ]);
  });
});

test("micromark-extension-attribute (inline)", async function (t) {
  await t.test("should parse {.class} after strong", async function () {
    // Attributes are consumed (no HTML handler), so they disappear from output
    assert.equal(m("**bold**{.class}"), "<p><strong>bold</strong></p>");
  });

  await t.test("should parse {#id} after emphasis", async function () {
    assert.equal(m("*em*{#myid}"), "<p><em>em</em></p>");
  });

  await t.test("should parse {key=value} after code", async function () {
    assert.equal(m('`code`{style="color:red"}'), "<p><code>code</code></p>");
  });

  await t.test("should parse multiple attributes", async function () {
    assert.equal(
      m('**bold**{#id .class style="color:red"}'),
      "<p><strong>bold</strong></p>",
    );
  });

  await t.test("should parse boolean attribute", async function () {
    assert.equal(m("**bold**{awesome}"), "<p><strong>bold</strong></p>");
  });

  await t.test("should parse empty attributes", async function () {
    assert.equal(m("**bold**{}"), "<p><strong>bold</strong></p>");
  });

  await t.test("should parse single-quoted value", async function () {
    assert.equal(
      m("**bold**{style='color:red'}"),
      "<p><strong>bold</strong></p>",
    );
  });

  await t.test("should parse unquoted value", async function () {
    assert.equal(m("**bold**{style=color}"), "<p><strong>bold</strong></p>");
  });

  await t.test(
    "should parse class and id shortcuts together",
    async function () {
      assert.equal(m("*em*{#myid.cls1.cls2}"), "<p><em>em</em></p>");
    },
  );

  await t.test(
    "should not consume invalid attribute syntax (comma)",
    async function () {
      assert.equal(
        m("This is {not, valid} text"),
        "<p>This is {not, valid} text</p>",
      );
    },
  );

  await t.test("should not consume unclosed brace", async function () {
    assert.equal(m("**bold**{.class"), "<p><strong>bold</strong>{.class</p>");
  });

  await t.test("should not consume {=value} (missing name)", async function () {
    assert.equal(m("**bold**{=value}"), "<p><strong>bold</strong>{=value}</p>");
  });

  await t.test("should parse attributes in heading text", async function () {
    assert.equal(m("# Title {.class}"), "<h1>Title </h1>");
  });

  await t.test("should parse attributes after link", async function () {
    assert.equal(
      m('[link](url){rel="external"}'),
      '<p><a href="url">link</a></p>',
    );
  });

  await t.test("should parse attributes after image", async function () {
    assert.equal(
      m("![alt](img.jpg){height=50}"),
      '<p><img src="img.jpg" alt="alt" /></p>',
    );
  });

  await t.test(
    "should parse multiple inline attributes in one paragraph",
    async function () {
      assert.equal(
        m("*a*{.x} and **b**{.y}"),
        "<p><em>a</em> and <strong>b</strong></p>",
      );
    },
  );

  await t.test(
    "should not support EOL in inline attributes",
    async function () {
      assert.equal(
        m("**bold**{.class\n}"),
        "<p><strong>bold</strong>{.class\n}</p>",
      );
    },
  );
});

test("micromark-extension-attribute (flow/block)", async function (t) {
  await t.test("should parse {.class} on its own line", async function () {
    assert.equal(m("# Title\n{.class}"), "<h1>Title</h1>\n");
  });

  await t.test("should parse {#id} on its own line", async function () {
    assert.equal(m("# Title\n{#myid}"), "<h1>Title</h1>\n");
  });

  await t.test(
    'should parse {data-id="title"} on its own line',
    async function () {
      assert.equal(m('# Title\n{data-id="title"}'), "<h1>Title</h1>\n");
    },
  );

  await t.test(
    "should parse block attributes with trailing whitespace",
    async function () {
      assert.equal(m("# Title\n{.class}   "), "<h1>Title</h1>\n");
    },
  );

  await t.test(
    "should consume {.class} even with trailing text (text hook)",
    async function () {
      // The text-level construct consumes {.class} since it's valid attribute syntax.
      // Unattached attributes are handled at the mdast-util layer.
      assert.equal(m("{.class} extra text"), "<p> extra text</p>");
    },
  );

  await t.test("should not support EOL in block attributes", async function () {
    assert.equal(m("{.class\n}"), "<p>{.class\n}</p>");
  });

  await t.test(
    "should parse block attributes after setext heading",
    async function () {
      assert.equal(m("Title\n=====\n{.class}"), "<h1>Title</h1>\n");
    },
  );
});
