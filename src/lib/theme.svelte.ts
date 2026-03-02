class ThemeState {
	isDark = $state(true);
	toggle() {
		this.isDark = !this.isDark;
	}
}

export const theme = new ThemeState();
