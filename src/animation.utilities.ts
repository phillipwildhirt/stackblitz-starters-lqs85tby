import { from, merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type AnimationCallbackEvent = {
  target: Element;
  animationComplete: Function;
};

export class AnimationUtilities {
  static onAnimationDone($event: AnimationCallbackEvent, callback: Function, unsub$: Subject<void>): void {
    const animations = $event.target.getAnimations();
    console.log('animating')
    if (animations.length) {
      merge(...animations.map((animation) => from(animation.finished))).pipe(
        takeUntil(unsub$)
      ).subscribe({
        complete: () => {
          console.log('complete')
          if ($event.target.id === 'ida681b32a-8143-4510-9f00-154c6c46988c') console.log('removed the draft')
          callback();
          $event.animationComplete();
        }
      });
    } else {
      callback();
      $event.animationComplete();
      // currently angular will not remove the element if there is no animations and the (animate.leave) event fired.
      $event.target.remove();
    }
  }
}
