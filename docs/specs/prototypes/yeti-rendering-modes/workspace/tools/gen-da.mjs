// PROTOTYPE: writes messages.da.xlf from messages.xlf with Danish targets.
import { readFileSync, writeFileSync } from 'node:fs';

const da = {
  cardTitle: 'Weekend i bakkerne',
  cardBody:
    'Ti kilometer, <x id="START_TAG_STRONG" ctype="x-strong" equiv-text="&lt;strong&gt;"/>en top<x id="CLOSE_TAG_STRONG" ctype="x-strong" equiv-text="&lt;/strong&gt;"/> og <x id="ICU" equiv-text="{views, plural, =1 {one view} other {{{views}} views}}" xid="3626743838881561634"/>.',
  '8492743040789932836': '{VAR_PLURAL, plural, =1 {en udsigt} other {<x id="INTERPOLATION"/> udsigter}}',
  cardMore: 'Læs mere',
  dialogOpen: 'Slet projekt',
  dialogTitle: 'Slet dette projekt?',
  tabA: 'Profil',
  tabB: 'Betaling',
};
let xlf = readFileSync('src/locale/messages.xlf', 'utf8').replace(
  'source-language="en-US"',
  'source-language="en-US" target-language="da"',
);
for (const [id, target] of Object.entries(da)) {
  const re = new RegExp(`(<trans-unit id="${id}"[^>]*>\\s*<source>[\\s\\S]*?</source>)`);
  if (!re.test(xlf)) {
    throw new Error('missing ' + id);
  }

  xlf = xlf.replace(re, `$1\n        <target>${target}</target>`);
}
writeFileSync('src/locale/messages.da.xlf', xlf);
console.log('wrote messages.da.xlf');
