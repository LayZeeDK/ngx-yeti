// Prints results/<browser>.json side by side; one line when all browsers agree.
import { readFileSync } from 'node:fs';

const browsers = ['chromium', 'firefox', 'webkit'];
const runs = browsers.map((b) => JSON.parse(readFileSync(`results/${b}.json`, 'utf8')));
const keys = [...new Set(runs.flatMap((r) => Object.keys(r)))];

for (const key of keys) {
  const values = runs.map((r) => JSON.stringify(r[key]));
  console.log(`\n# ${key}`);

  if (values.every((v) => v === values[0])) {
    console.log(`  all: ${values[0]}`);
  } else {
    browsers.forEach((b, i) => console.log(`  ${b}: ${values[i]}`));
  }
}
