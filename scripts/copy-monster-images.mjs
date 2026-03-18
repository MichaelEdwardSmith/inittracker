import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const monsters2014Path = resolve('src/lib/data/monsters.json');
const monsters2024Path = resolve('src/lib/data/monsters-2024.json');

const monsters2014 = JSON.parse(readFileSync(monsters2014Path, 'utf-8'));
const monsters2024 = JSON.parse(readFileSync(monsters2024Path, 'utf-8'));

// Build a lookup map from normalized name -> img_url for 2014 monsters
const imageMap = new Map();
for (const m of monsters2014) {
	if (m.img_url && m.name) {
		imageMap.set(m.name.trim().toLowerCase(), m.img_url);
	}
}

let matched = 0;
let skipped = 0;

for (const m of monsters2024) {
	if (!m.name) continue;
	const key = m.name.trim().toLowerCase();
	const imgUrl = imageMap.get(key);
	if (imgUrl) {
		if (!m.imgUrl) {
			m.imgUrl = imgUrl;
			matched++;
		} else {
			skipped++;
		}
	}
}

writeFileSync(monsters2024Path, JSON.stringify(monsters2024, null, 2), 'utf-8');
console.log(`Done. Matched and updated: ${matched}, already had image (skipped): ${skipped}`);
