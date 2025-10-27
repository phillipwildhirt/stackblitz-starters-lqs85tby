import { Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, Output, Renderer2, inject } from '@angular/core';
import { delay, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

export enum ComponentState {
    normal = 0,
    hover,
    pressed,
    focus,
    active
}


@Directive({
    standalone: true,
    selector: '[dpsComponentState]'
})
/**
 * Directive for applying hover, focus, press to the element applied to.
 It also can return the Component State of the element applied to.
 *
 * For example:
 * - mouseenter applies '``hover``' and emits ``ComponentState.hover``
 * - mouseleave removes '``hover``'
 * - mousedown apples both '``focus``' and '``hover``', and emits ``ComponentState.press``
 * - etc.
 */
export class ComponentStateDirective implements OnDestroy {
    private el = inject(ElementRef);
    private renderer = inject(Renderer2);

    /**
     * Outputs the current mouse component state using Component State
     * @type EventEmitter<ComponentState>
     */
    @Output('dpsComponentState') componentStates = new EventEmitter<ComponentState[]>();
    @Input() applyState: boolean = true;

    private latestStates: ComponentState[] = [ComponentState.normal];
    private stateMap: Map<ComponentState, boolean> = new Map([
        [ComponentState.hover, false],
        [ComponentState.active, false],
        [ComponentState.pressed, false],
        [ComponentState.focus, false],
    ]);
    private readonly unsub$ = new Subject<void>();

    private afterMouseDown?: CallableFunction;
    private wayAfterMouseDown?: CallableFunction;
    private afterMouseUp?: CallableFunction;

    @HostListener('mouseenter') onMouseEnter(): void {
        this.stateMap.set(ComponentState.hover, true);
        this.componentStates.next(this.getAllComponentStates());
        if (this.applyState) this.renderer.addClass(this.el.nativeElement, 'hover');
    }
    @HostListener('mouseleave') onMouseLeave(): void {
        this.stateMap.set(ComponentState.hover, false);
        this.componentStates.next(this.getAllComponentStates());
        if (this.applyState) this.renderer.removeClass(this.el.nativeElement, 'hover');
    }
    @HostListener('mousedown') onMouseDown(): void {
        this.stateMap.set(ComponentState.active, true);
        this.stateMap.set(ComponentState.focus, true);
        this.stateMap.set(ComponentState.pressed, true);
        this.componentStates.next(this.getAllComponentStates());
        if (this.applyState) this.renderer.addClass(this.el.nativeElement,'active');
        if (this.applyState) this.renderer.addClass(this.el.nativeElement, 'focus');
        this.afterMouseDown = this.renderer.listen(window, 'mouseup', () => this.onMouseUp());
        of(void 0).pipe(delay(1)).subscribe(() =>
            this.wayAfterMouseDown = this.renderer.listen(window, 'mousedown', ($event) => this.onClickElsewhere($event)));
    }

    constructor() {
        this.componentStates.pipe(takeUntil(this.unsub$)
        ).subscribe( v => this.latestStates = v);
    }

    ngOnDestroy(): void {
        //remove listener
        if (this.afterMouseDown) this.afterMouseDown();
        if (this.wayAfterMouseDown) this.wayAfterMouseDown();
        if (this.afterMouseUp) this.afterMouseUp();

        this.unsub$.next();
        this.unsub$.complete();
    }

    private onMouseUp(): void {
        this.stateMap.set(ComponentState.pressed, false);
        this.stateMap.set(ComponentState.active, false);
        this.componentStates.next(this.getAllComponentStates());
        if (this.applyState) this.renderer.removeClass(this.el.nativeElement,'active');
        of(void 0).pipe(delay(1)).subscribe(() =>
            this.afterMouseUp = this.renderer.listen(window, 'mouseup', ($event) => this.onClickElsewhere($event)));
        if (this.afterMouseDown) this.afterMouseDown();
    }

    private onClickElsewhere(event: MouseEvent): void {
        if (this.latestStates.find(s => s === ComponentState.active || s === ComponentState.focus || s === ComponentState.pressed) !== undefined) {
            if (event.composedPath().every((item: EventTarget) => {
                if (item instanceof HTMLElement) {
                    return item.id !== this.el.nativeElement.id;
                } else {
                    return true;
                }
            })) {
                this.stateMap.set(ComponentState.focus, false);
                this.componentStates.next(this.getAllComponentStates());
                if (this.applyState) this.renderer.removeClass(this.el.nativeElement, 'focus');
            }
        }
        //remove listener
        if (this.wayAfterMouseDown) this.wayAfterMouseDown();
        if (this.afterMouseUp) this.afterMouseUp();
    }

    private getAllComponentStates(): ComponentState[] {
        const cs: ComponentState[] = [];
        this.stateMap.forEach( (v, k) => {
            if (v) cs.push(k);
        });
        return cs.length === 0 ? [ComponentState.normal] : cs;
    }
}
