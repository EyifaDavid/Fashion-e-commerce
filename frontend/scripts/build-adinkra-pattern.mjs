// [NORTH] Preserve the sourced symbols' exact path geometry in self-contained backgrounds.
import { readFile, writeFile } from "node:fs/promises";
const symbols = await Promise.all(["gye-nyame", "dwennimmen", "sankofa"].map(async name => {
  const svg = await readFile("src/assets/adinkra/" + name + ".svg", "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/?\s*>/g)].map(match =>
    `<path d="${match[1]}" fill-rule="evenodd"/>`).join("");
  if (!paths) throw new Error("Missing symbol path: " + name);
  return { name, viewBox, paths };
}));
for (const [file, colour, opacity] of [
  ["adinkra.svg", "#766549", ".22"],
  ["adinkra-light.svg", "#e5d5b7", ".19"],
  ["adinkra-subtle.svg", "#766549", ".035"],
  ["adinkra-banner.svg", "#766549", ".22"],
  ["adinkra-footer.svg", "#e5d5b7", ".19"],
]) {
  // [NORTH] The short offers banner gets one aligned row; Sankofa stays with its peers.
  const isRow = file === "adinkra-banner.svg" || file === "adinkra-footer.svg";
  const height = isRow ? 100 : 360;
  const positions = isRow
    ? [[24, 12, 60, 76], [144, 14, 72, 72], [274, 10, 60, 80]]
    : [[42, 38, 80, 92], [202, 58, 76, 76], [122, 214, 64, 88]];
  const content = symbols.map(({name, viewBox, paths}, index) => {
    const [x, y, width, height] = positions[index];
    return `    <svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${viewBox}"><title>${name}</title>${paths}</svg>`;
  }).join("\n");
  await writeFile("public/patterns/" + file,
    `<!-- [NORTH] Gye Nyame, Dwennimmen and Sankofa; source credits in src/assets/adinkra/README.md. -->\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="${height}" viewBox="0 0 360 ${height}">\n` +
    `  <title>Gye Nyame, Dwennimmen and Sankofa Adinkra pattern</title>\n  <g fill="${colour}" opacity="${opacity}">\n${content}\n  </g>\n</svg>\n`);
}
