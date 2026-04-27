import adapter from "@sveltejs/adapter-static";

// Деплой: GitHub Pages с custom domain tablemind.ru.
// paths.base пустой — фронт раздаётся с корня домена (не из подпапки /tablemind-site).
// Если когда-нибудь захотим уйти с custom domain на kokolsk1y.github.io/tablemind-site —
// поменять base на "/tablemind-site".

const config = {
	kit: {
		adapter: adapter({
			pages: "build",
			assets: "build",
			fallback: "404.html",
			strict: false
		}),
		appDir: "app"
	}
};

export default config;
