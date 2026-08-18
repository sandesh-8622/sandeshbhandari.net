import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "@/site.config";
import { collectionDateSort } from "@/utils/date";

export const GET = async () => {
	const reposts = (await getCollection("repost")).sort(collectionDateSort);

	return rss({
		title: `${siteConfig.title}: Reposts`,
		description: "Blogs and research papers reposted by Sandesh Bhandari",
		site: import.meta.env.SITE,
		items: reposts.map(({ data }) => ({
			title: data.title,
			description: data.note ?? "",
			pubDate: data.publishDate,
			link: data.url,
		})),
	});
};
