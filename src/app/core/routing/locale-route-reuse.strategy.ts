import { ActivatedRouteSnapshot, BaseRouteReuseStrategy } from '@angular/router';

/**
 * Angular reuses a component when only a route parameter changes, so switching
 * language re-used the page and left its title, description and JSON-LD in the
 * previous language — ngOnInit, where every page sets them, never ran again.
 *
 * Prerendered pages were always correct; this only affected switching in-session.
 */
export class LocaleRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    if (future.params['locale'] !== current.params['locale']) {
      return false;
    }
    return super.shouldReuseRoute(future, current);
  }
}
