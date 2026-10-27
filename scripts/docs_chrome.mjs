// Adds the ghostpaw.dev top bar and footer to the demo shell at /docs/,
// matching the landing page at the site root. Demo shell only; no library code.
import { readdirSync } from 'node:fs';

const LIBS = ['codex', 'questlog', 'affinity', 'souls', 'grimoire', 'email', 'telegram'];

function landingFont() {
	try {
		const f = readdirSync('site/release').find((n) => /^tektur-var-[0-9a-f]+\.woff2$/.test(n));
		return f ? `../${f}` : null;
	} catch {
		return null;
	}
}

/** Collapse a CSS string: drop comments and redundant whitespace. */
export function minifyCss(css) {
	return css
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\s+/g, ' ')
		.replace(/\s*([{}:;,>])\s*/g, '$1')
		.replace(/;}/g, '}')
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.trim();
}

/**
 * @param {string} html  the generated demo shell
 * @param {{ lib: string, layoutCss?: string }} opts
 */
// Cloudflare Web Analytics (cookieless). Public beacon token.
const BEACON = `<script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "eb094a31847f4b1b96558586692a6f73"}'></script>\n`;

export function addDocsChrome(html, { lib, layoutCss = '' }) {
	const font = landingFont();
	const home = `https://${lib}.ghostpaw.dev/`;
	const gh = `https://github.com/GhostPawJS/${lib}`;
	const npm = `https://www.npmjs.com/package/@ghostpaw/${lib}`;
	const fontFace = font
		? `@font-face{font-family:Tektur;src:url("${font}") format("woff2");font-weight:500 900;font-stretch:75% 100%;font-style:normal;font-display:swap}`
		: '';
	const css = minifyCss(`${fontFace}
:root{--gp-void:#04070b;--gp-rule:#1d2c3c;--gp-ghost:#e3edf5;--gp-haze:#93a5b9;--gp-spectral:#62e6f2;--gp-glow:rgba(98,230,242,.28);--gp-display:"Tektur",Bahnschrift,"Arial Narrow",sans-serif;--gp-body:system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.gp-top,.gp-foot{box-sizing:border-box;font:400 1.0625rem/1.6 var(--gp-body);color:var(--gp-ghost);background:var(--gp-void)}
.gp-top{border-bottom:1px solid var(--gp-rule)}
.gp-foot{border-top:1px solid var(--gp-rule);color:var(--gp-haze)}
.gp-wrap{max-width:72rem;margin:0 auto;padding-left:1.25rem;padding-right:1.25rem}
.gp-top .gp-wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem 1rem;padding-top:1.1rem;padding-bottom:1.1rem}
.gp-brand{font:700 1.2rem/1 var(--gp-display);font-stretch:85%;color:var(--gp-ghost);text-decoration:none;display:inline-flex;align-items:center;gap:.5rem}
.gp-brand:after{content:"";width:.5rem;height:1.05rem;background:var(--gp-spectral);box-shadow:0 0 12px var(--gp-glow)}
.gp-brand .gp-crumb{color:var(--gp-spectral);font-weight:600;margin-left:-.5rem}
.gp-top nav{display:flex;flex-wrap:wrap;gap:.4rem 1.1rem}
.gp-top nav a{color:var(--gp-haze);text-decoration:none;padding:.2rem 0}
.gp-top a:hover,.gp-foot a:hover{color:var(--gp-spectral)}
.gp-top a:focus-visible,.gp-foot a:focus-visible{outline:2px solid var(--gp-spectral);outline-offset:2px}
.gp-foot .gp-wrap{padding-top:2rem;padding-bottom:3rem}
.gp-foot p{margin:0 0 1rem}
.gp-foot a{color:var(--gp-haze);text-decoration-color:var(--gp-spectral);text-decoration-thickness:1px;text-underline-offset:.22em}
.gp-libs{display:flex;flex-wrap:wrap;gap:.4rem 1.25rem;margin-bottom:1rem;font:600 1rem var(--gp-display)}
.gp-libs a{color:var(--gp-ghost);text-decoration:none;display:inline-block;padding:.2rem 0}
.gp-libs a[aria-current]{color:var(--gp-spectral)}
.gp-links{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem}
.gp-links a{display:inline-block;padding:.2rem 0}
${layoutCss}`);
	const icon = /rel="icon"/.test(html) ? '' : '<link rel="icon" href="../favicon.png" />\n';
	const head = `${icon}${font ? `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin />\n` : ''}<style>${css}</style>\n`;
	const top = `<header class="gp-top"><div class="gp-wrap">
<a class="gp-brand" href="https://ghostpaw.dev/">GhostPaw<span class="gp-crumb">/${lib}</span></a>
<nav aria-label="${lib} elsewhere"><a href="${home}">Overview</a><a href="${gh}">GitHub</a><a href="${npm}">npm</a></nav>
</div></header>\n`;
	const libs = LIBS.map(
		(l) =>
			`<a${l === lib ? ' aria-current="true"' : ''} href="https://${l}.ghostpaw.dev/">${l}</a>`,
	).join('');
	const foot = `<footer class="gp-foot"><div class="gp-wrap">
<nav class="gp-libs" aria-label="GhostPaw libraries">${libs}</nav>
<p>${lib} is one of seven GhostPaw libraries, maintained in the open under the MIT licence.</p>
<p class="gp-links"><a href="https://ghostpaw.dev/">GhostPaw home</a><a href="${gh}">Source on GitHub</a><a href="${npm}">${lib} on npm</a><a href="https://lab.anonyfox.com/impressum/">Impressum</a><a href="https://lab.anonyfox.com/datenschutz/">Datenschutz</a></p>
</div></footer>\n`;
	return html
		.replace('</head>', `${head}</head>`)
		.replace(/<body([^>]*)>\n?/, (m) => `${m.trimEnd()}\n${top}`)
		.replace(/(<script type="module"[^>]*><\/script>\s*)?<\/body>/, (m) => `${foot}${m}`)
		.replace('</body>', `${BEACON}</body>`);
}
