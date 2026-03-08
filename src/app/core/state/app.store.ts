import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';

export interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

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
  withMethods(store => ({
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
  }))
);
