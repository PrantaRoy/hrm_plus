/**
 * Wraps a rendered document body with a fixed, repeating "DEMO PREVIEW" diagonal
 * overlay. Used only for the staff-facing preview shown before a request is issued
 * — the final PDF is rendered from the un-watermarked template.
 */
export function injectWatermark(html: string): string {
  const watermarkStyle = `
    <style>
      .doc-builder-watermark {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        display: flex;
        flex-wrap: wrap;
        align-content: space-around;
        justify-content: space-around;
        overflow: hidden;
      }
      .doc-builder-watermark span {
        transform: rotate(-35deg);
        font-size: 32px;
        font-weight: 700;
        font-family: sans-serif;
        color: rgba(200, 30, 30, 0.25);
        white-space: nowrap;
      }
    </style>
  `;
  const watermarkOverlay = `
    <div class="doc-builder-watermark">
      ${Array.from({ length: 24 }, () => "<span>DEMO PREVIEW</span>").join("")}
    </div>
  `;

  if (/<\/body>/i.test(html)) {
    return html
      .replace(/<\/head>/i, `${watermarkStyle}</head>`)
      .replace(/<\/body>/i, `${watermarkOverlay}</body>`);
  }
  return `${watermarkStyle}${html}${watermarkOverlay}`;
}
