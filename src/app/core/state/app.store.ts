import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { PlatformService } from '@core/services/platform.service';

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

const THEME_STORAGE_KEY = 'ahram-theme';

const initialState: AppState = {
  theme: 'light',
  sidebarOpen: false,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(store => ({
    isDarkMode: computed(() => store.theme() === 'dark'),
  })),
  withMethods(store => {
    const platform = inject(PlatformService);

    return {
      initialize(): void {
        platform.runInBrowser(() => {
          const stored = localStorage.getItem(THEME_STORAGE_KEY);
          if (stored === 'dark' || stored === 'light') {
            patchState(store, { theme: stored });
          }
        });
      },
      toggleTheme(): void {
        const next: 'light' | 'dark' = store.theme() === 'light' ? 'dark' : 'light';
        patchState(store, { theme: next });
      },
      setTheme(theme: 'light' | 'dark'): void {
        patchState(store, { theme });
      },
      toggleSidebar(): void {
        patchState(store, state => ({ sidebarOpen: !state.sidebarOpen }));
      },
      setSidebar(open: boolean): void {
        patchState(store, { sidebarOpen: open });
      },
    };
  }),
  withHooks(store => {
    const platform = inject(PlatformService);
    const document = inject(DOCUMENT);

    return {
      onInit() {
        effect(() => {
          const isDark = store.isDarkMode();
          platform.runInBrowser(() => {
            document.documentElement.classList.toggle('dark', isDark);
            localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
          });
        });
      },
    };
  })
);
