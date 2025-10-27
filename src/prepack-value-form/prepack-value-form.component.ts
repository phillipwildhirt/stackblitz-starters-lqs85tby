import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { ComponentState, ComponentStateDirective } from './component-state.directive';


@Component({
  selector: 'app-prepack-value-form',
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgClass,
    ComponentStateDirective,
  ],
  templateUrl: './prepack-value-form.component.html',
  styleUrl: './prepack-value-form.component.scss'
})
export class PrepackValueFormComponent implements AfterViewInit, OnDestroy {
  @Input({required: true}) size!: string;
  @Input({required: true}) control!: FormControl<number | null>;
  @Input({required: true}) tabIndex!: number;
  @Input({required: true}) hiddenAcrossSizes!: Map<string, number>;
  @Input({required: true}) scrollToNextSize$!: Subject<string>;
  @Input() isSkeleton: boolean = false;

  private readonly renderer = inject(Renderer2);
  private readonly elRef = inject(ElementRef);

  private incListener?: () => void;
  private decListener?: () => void;
  protected padding = 0;
  protected arrows = 0.375 + 0.375 + 0.75;
  @ViewChild('sizeUnitsInputRef') input?: ElementRef<HTMLInputElement>;
  protected activeButtonStateClass: string = '';
  private clicked$ = new Subject<string>;

  constructor() {
    this.clicked$.pipe(takeUntilDestroyed(), debounceTime(300)).subscribe((buttonName) =>
      this.elRef.nativeElement.querySelector(buttonName).blur()
    );
  }

  ngAfterViewInit(): void {
    if (this.input && this.elRef) {
      const incEl = this.elRef.nativeElement.querySelector('button.inc');
      if (incEl)
        this.incListener = this.renderer.listen(incEl, 'click', () => this.inc());
      const decEl = this.elRef.nativeElement.querySelector('button.dec');
      if (decEl)
        this.decListener = this.renderer.listen(decEl, 'click', () => this.dec());
    }
  }

  ngOnDestroy(): void {
    if (this.incListener)
      this.incListener();
    if (this.decListener)
      this.decListener();
  }

  private inc(): void {
    if (this.input) {
      this.control.markAsDirty();
      this.control.setValue((this.control.value ? this.control.value : 0) + +this.input.nativeElement.step);
      this.clicked$.next('button.inc');
    }
  }

  private dec(): void {
    if (this.input) {
      this.control.markAsDirty();
      this.control.setValue(this.control.value ? this.control.value - +this.input.nativeElement.step : 0);
      this.clicked$.next('button.dec');
    }
  }

  onKeyDownEnter(prepackValue: HTMLInputElement): void {
    prepackValue.blur();
    for (let i = this.tabIndex + 1; i < this.tabIndex + 100; i++) {
      let nextElement = document.getElementById('PrepackValue-' + i);
      if (nextElement && !this.hiddenAcrossSizes.has(nextElement.getAttribute('placeholder') ?? '')) {
        nextElement.focus();
        if (nextElement.getAttribute('placeholder')) this.scrollToNextSize$.next(nextElement.getAttribute('placeholder')!);
        break;
      }
    }
  }

  onKeyUpTab(sizeUnitsInputRef: HTMLInputElement) {
    if (sizeUnitsInputRef.getAttribute('placeholder')) this.scrollToNextSize$.next(sizeUnitsInputRef.getAttribute('placeholder')!);
  }

  checkSizeUnitsKeyup(inputRef: HTMLInputElement) {
    if (inputRef.value.length > 1 && inputRef.value.startsWith('0'))
      this.control.setValue(Number(this.control.value));
  }

  onComponentState($event: ComponentState[]): void {
    this.activeButtonStateClass = $event.map(s => {
      switch (s) {
        case ComponentState.hover:
          return 'prepack-unit-button';
        default:
          return '';
      }
    }).join(' ');
  }

  preventKeydown($event: KeyboardEvent) {
    if ($event.key === '.') $event.preventDefault();
  }
}
