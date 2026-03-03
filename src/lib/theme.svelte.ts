// Tiny Svelte 5 runes singleton for light/dark theme. Persists the preference to
// localStorage and applies a "dark" class to <html> via a $effect in +layout.svelte.
class ThemeState {
	isDark = $state(true);
	toggle() {
		this.isDark = !this.isDark;
	}
}

export const theme = new ThemeState();
