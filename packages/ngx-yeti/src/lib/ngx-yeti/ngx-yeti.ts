import { Component, input } from '@angular/core';

@Component({
  selector: 'yeti-ngx-yeti',
  imports: [],
  templateUrl: './ngx-yeti.html',
  styleUrl: './ngx-yeti.css',
})
export class NgxYeti {
  readonly packageName = input('ngx-yeti');
}
