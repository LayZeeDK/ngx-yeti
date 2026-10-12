import { Directive } from '@angular/core';
import { injectYetiItemStyles } from 'ngx-yeti/styles';

/**
 * Yeti's `container` on the consumer's element: the `container` class and the
 * `container` item file, which make the box the size container its
 * descendants' `yetiShow` and `yetiHide` measure (container spec, sections 2
 * to 4). The container arranges nothing and adds no role, no tab stop, and
 * no listener.
 *
 * Usage rules:
 *
 * 1. Put `yetiShow` and `yetiHide` only on an element that has a size
 *    container above it: a `yetiContainer`, or an item Yeti makes one (`nav`,
 *    `pagination`, `timeline`, the `demo` preview, a `grid` with `fold` or
 *    `tracks`, a `cluster` with `threshold`, a `card` whose first child is a
 *    figure, a `breakout` holding a note). Without one, the marker does
 *    nothing.
 * 2. A marker on a `yetiContainer` host is measured against the nearest size
 *    container above that host, never against its own box, because an
 *    element cannot query itself.
 * 3. Nothing a reader needs may live only in the version a marker removes.
 *    An element removed by a marker is out of the accessibility tree too.
 *    Prefer an item that changes shape at its own threshold over two marked
 *    versions of one thing.
 * 4. A table is not a size container. To remove a column at narrow widths,
 *    wrap the table in a `yetiContainer` and put the same marker on the
 *    header cell and every body cell of that column.
 * 5. Do not write `class="container"`, `data-show`, `data-hide`, or
 *    `data-ngx-yeti-item-container` statically on a host. The directives bind
 *    them.
 * 6. To name a `container` for your own `@container` rules, give the host an
 *    application class and set `container-name` on it in your stylesheet. A
 *    name cannot come from an attribute, and the directive offers no input
 *    for it.
 * 7. Import `YetiContainer`, `YetiShow`, and `YetiHide` in every component
 *    whose template writes them. A forgotten import of `YetiContainer`
 *    renders a plain element with no error, because the directive has no
 *    input the compiler could report. A forgotten `YetiShow` or `YetiHide`
 *    with a static value also compiles, as an unknown attribute, and the
 *    element shows at every width; a bound value (`[yetiShow]`) is reported
 *    as NG8002.
 *
 * In a Tailwind v4 application, Tailwind generates its own `.container`
 * above Yeti's unless the global stylesheet has
 * `@source not inline('container');`, as the setup in the package README
 * writes it.
 *
 * For a container first rendered on the client, add `container` to
 * `provideYetiStyles({ preload })` from `ngx-yeti/styles`: until its file
 * applies, every marker inside it shows.
 */
@Directive({
  selector: '[yetiContainer]',
  host: {
    class: 'container',
    'data-ngx-yeti-item-container': '',
  },
  exportAs: 'yetiContainer',
})
export class YetiContainer {
  constructor() {
    injectYetiItemStyles('container');
  }
}
