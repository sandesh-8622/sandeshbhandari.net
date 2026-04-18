// Vim-style keyboard shortcuts configuration
// Add a new section: just add one line here with { key, path, label }
export const NAV_SHORTCUTS: { key: string; path: string; label: string }[] = [
	{ key: "a", path: "/", label: "About" },
	{ key: "b", path: "/posts/", label: "Blog" },
	{ key: "p", path: "/photography/", label: "Photography" },
	{ key: "w", path: "/work/", label: "Work" },
];

export const PREFIX_TIMEOUT = 1000; // ms before g-prefix resets
