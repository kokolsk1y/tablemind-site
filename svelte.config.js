import adapterAuto from "@sveltejs/adapter-auto";
import adapterStatic from "@sveltejs/adapter-static";

// На Vercel (Linux) adapter-auto детектит окружение и подставляет adapter-vercel.
// Локально на Windows adapter-vercel падает из-за symlink, поэтому для local build
// используем adapter-static. На Vercel будет prerendered static + SSR где нужен.
const isVercel = Boolean(process.env.VERCEL);

const config = {
	kit: {
		adapter: isVercel
			? adapterAuto()
			: adapterStatic({
					pages: "build",
					assets: "build",
					fallback: "404.html",
					strict: false
			  })
	}
};

export default config;
