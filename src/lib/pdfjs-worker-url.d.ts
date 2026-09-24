// Ambient declaration for Vite's `?url` asset-import suffix, scoped to just the pdf.js worker
// specifier DocShareModal.svelte imports. Avoids touching the project's global `types` array.
declare module 'pdfjs-dist/build/pdf.worker.mjs?url' {
	const workerUrl: string;
	export default workerUrl;
}
