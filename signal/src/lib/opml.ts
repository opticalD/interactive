import { LANES, SOURCES } from "../sources";

/**
 * The point of Signal is to make reading pull rather than push. If you later
 * move to Feedly or a self-hosted FreshRSS, your source list should come with
 * you — every reader imports OPML.
 */
export function buildOpml(enabledIds: string[]): string {
  const enabled = new Set(enabledIds);
  const groups = LANES.map((lane) => {
    const sources = SOURCES.filter(
      (s) => s.lane === lane.id && s.feed && enabled.has(s.id)
    );
    if (sources.length === 0) return "";
    const outlines = sources
      .map(
        (s) =>
          `      <outline type="rss" text="${esc(s.name)}" title="${esc(s.name)}" ` +
          `xmlUrl="${esc(s.feed!)}" htmlUrl="${esc(s.site)}" />`
      )
      .join("\n");
    return `    <outline text="${esc(lane.label)}" title="${esc(lane.label)}">\n${outlines}\n    </outline>`;
  })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Signal subscriptions</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${groups}
  </body>
</opml>
`;
}

export function downloadOpml(enabledIds: string[]) {
  const blob = new Blob([buildOpml(enabledIds)], { type: "text/x-opml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "signal-subscriptions.opml";
  a.click();
  URL.revokeObjectURL(url);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
