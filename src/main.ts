import { Component, OnDestroy } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AnimationUtilities } from './animation.utilities';
import { of, Subject } from 'rxjs';
import { PrepackValueFormComponent } from './prepack-value-form/prepack-value-form.component';
import { FormControl } from '@angular/forms';
import { delay } from 'rxjs/operators';

type Item = {text: string, type: 0 | 1 | 2, controls: FormControl<number | null>[], scroll$: Subject<string>};

@Component({
  selector: 'app-root',
  template: `
    <div style="padding-bottom: 1rem">
      <button (click)="toggle()">
        @if (filter < 2) {
          Filter Data to type {{ filter }}
        } @else {
          Do Not Filter
        }
      </button>
    </div>
    <div class="container">
      @for (item of filtered; track trackItemValues(item)) {
        <div class="min-height-animate"
             [id]="item.text"
             [style.min-height.rem]=" shouldAnimate ? 3.9 : 1.9"
             animate.leave="remove-x-easy-animation time-300 distance-n100"
             [class.instant-animation]="!shouldAnimate"
             (animate.leave)="AnimationUtilities.onAnimationDone($event, animationCallback, unsub$)">
          {{ item.text }}
          <div style="display: flex;">
            @for (control of item.controls; track $index + '' + ci; let ci = $index) {
              <app-prepack-value-form size="XL"
                                      [control]="control"
                                      [tabIndex]="$index + ci"
                                      [hiddenAcrossSizes]="dataMap"
                                      [scrollToNextSize$]="item.scroll$"/>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './main.scss',
  imports: [
    PrepackValueFormComponent
  ]
})
export class App implements OnDestroy {
  name = 'Angular';
  unsub$ = new Subject<void>();
  data: Item[] = [
    ...Array.from(Array(200)).map((v, index) => ({
      text: (Math.ceil(Math.random() * 2) === 1 ? 'this ' : 'that ') + index,
      type: (index % 2) as 0 | 1 | 2,
      controls: [...Array.from(Array(10)).map(() => new FormControl<number | null>(null))],
      scroll$: new Subject<string>()
    }))
  ];
  dataMap = new Map<string, number>(this.data.map(i => ([i.text, i.type])));
  filtered: Item[] = [];
  filter = 2;
  animationCallback = () => this.doThis$.next();
  doThis$ = new Subject<void>();
  shouldAnimate = false;

  constructor() {
    this.toggle();
  }

  ngOnDestroy() {
    this.unsub$.next();
    this.unsub$.complete();
  }

  toggle(): void {
    this.filtered = this.filter < 2 ? this.data.filter((item) => item.type === this.filter) : [...this.data];
    if (this.filter < 2)
      this.filter++;
    else
      this.filter = 0;
    of(void 0).pipe(delay(0)).subscribe(() => this.filtered = this.filter < 2 ? this.data.filter((item) => item.type === this.filter) : [...this.data]);
  }

  trackItemValues(item: Item): string {
    return `text:${item.text},
        type:${item.type}
        value: ${item.controls.map(c => c.value).join()}`;
  }

  protected readonly AnimationUtilities = AnimationUtilities;
}

bootstrapApplication(App);
