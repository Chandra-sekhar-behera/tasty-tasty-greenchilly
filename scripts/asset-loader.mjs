// Lets plain Node import image assets as empty strings so the menu data can be tested outside Vite.
export async function load(url, ctx, next) {
  if (/\.(webp|jpe?g|png|svg)$/.test(url)) return { format: "module", source: `export default ${JSON.stringify(url)};`, shortCircuit: true };
  return next(url, ctx);
}
