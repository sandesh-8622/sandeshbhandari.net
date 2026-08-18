export type Project = {
	title: string;
	subtitle: string;
	description: string;
	tags: string[];
	link: string;
};

export const work: Project[] = [
	{
		title: "Data Analyst Intern",
		subtitle: "Norplex-Micarta, Postville, IA · May 2026 – Present",
		description:
			"🚚 Tracking procurement costs, delivery, and vendor performance with ERP data\n🐼 Building reports and dashboards with Power BI, Excel, and Pandas",
		tags: ["Data Analytics", "ERP Systems", "Procurement", "Automation"],
		link: "",
	},
	{
		title: "Open Source Contributor – LFX Mentorship",
		subtitle: "Magma Core, The Linux Foundation",
		description:
			"📡 Contributing code to an open-source mobile core network\n📶 Working on software for building and deploying mobile networks",
		tags: ["Open Source", "Magma", "Linux Foundation", "Mobile Networks"],
		link: "",
	},
	{
		title: "Marketing Assistant & Web Maintainer",
		subtitle: "Luther College, Decorah, IA",
		description:
			"✍️ Writing press releases, articles, newsletters, and social media content\n💻 Maintaining web resources used by 1,400+ computer science students",
		tags: ["Web Development", "Content", "Editorial", "UI"],
		link: "",
	},
	{
		title: "Undergraduate Research Assistant",
		subtitle: "University of Idaho – Data Analytics & Vision Lab (IAMP)",
		description:
			"🌾 Processing 50,000+ agricultural sensor records with Python and PostgreSQL\n🛰️ Training crop-yield models and building computer vision pipelines",
		tags: ["Python", "Scikit-learn", "PostgreSQL", "OpenCV", "Research"],
		link: "",
	},
	{
		title: "IT Technician & Volunteer",
		subtitle: "Chain For Change – Project Wings to Dreams, Nepal",
		description:
			"👁️ Designing tactile learning tools for visually impaired students\n🧩 Building physical prototypes with Blender, OpenCV, and 3D printing",
		tags: ["3D Printing", "Blender", "OpenCV", "Education"],
		link: "",
	},
];

export const projects: Project[] = [
	{
		title: "Surgical Needle Insertion RL Environment",
		subtitle: "Reinforcement learning for robotic needle steering",
		description:
			"🩺 Training reinforcement learning agents for robotic needle insertion\n🧬 Simulating tissue mechanics, force, strain, and blood vessel proximity",
		tags: ["Python", "Reinforcement Learning", "PPO", "Stable-Baselines3", "Simulation"],
		link: "https://goldfish.sandeshbhandari.com/docs",
	},
	{
		title: "INFINI8",
		subtitle: "Browser-based infinite driving experience",
		description:
			"🏎️ Building an endless 3D driving world with procedural terrain and physics\n🎵 Adding Spotify, live lyrics, weather, and multiple camera modes",
		tags: ["Three.js", "JavaScript", "Spotify Web SDK", "Procedural Generation"],
		link: "https://infini8.sandeshbhandari.com/",
	},
	{
		title: "Bee My Baby",
		subtitle: "Pure CSS 3D animation",
		description:
			"🧱 Building a 3D animation using only HTML, CSS, and JavaScript\n🐝 Animating a bee and its environment entirely with CSS transforms",
		tags: ["CSS 3D", "Animation", "HTML", "JavaScript"],
		link: "https://beemybaby.sandeshbhandari.com/",
	},
	{
		title: "FilmRecs",
		subtitle: "Movie recommendation engine",
		description:
			"🎬 Building a movie recommender across 3,652 films\n🎯 Using Pandas, TF-IDF, and cosine similarity to rank recommendations",
		tags: ["Python", "Scikit-learn", "Pandas", "TF-IDF", "ML"],
		link: "https://huggingface.co/spaces/sandeshbhandari/FilmRecs",
	},
	{
		title: "Nonsense CS Research Gen",
		subtitle: "Fake academic CS paper generator",
		description:
			"🧪 Generating realistic academic papers from procedural data and text\n📄 Creating two-column PDFs with charts, tables, and references",
		tags: ["Python", "ReportLab", "Matplotlib", "PDF Generation"],
		link: "https://github.com/sandesh-8622/nonsense-cs-research-gen",
	},
	{
		title: "medium2pdf-scraper",
		subtitle: "Archive a Medium author's full back catalog",
		description:
			"🗃️ Archiving every article from a Medium author's profile\n📎 Automating scraping, PDF rendering, merging, and bookmarking",
		tags: ["Python", "Playwright", "PDF", "Web Scraping"],
		link: "https://github.com/sandesh-8622/medium2pdf-scraper",
	},
	{
		title: "Posture Coach",
		subtitle: "Real-time posture monitor with webcam",
		description:
			"🧍 Tracking posture in real time using webcam computer vision\n📐 Scoring posture, sending alerts, and visualizing weekly history",
		tags: ["Python", "OpenCV", "MediaPipe", "Flask", "Computer Vision"],
		link: "https://github.com/sandesh-8622/posturecoach",
	},
	{
		title: "Subreddit Image Downloader",
		subtitle: "Bulk download from any public subreddit",
		description:
			"👽 Building a CLI to bulk download media from public subreddits\n🗂️ Handling galleries, filters, videos, GIFs, and zip packaging",
		tags: ["Node.js", "JavaScript", "CLI", "Reddit API"],
		link: "https://github.com/sandesh-8622/subreddit-image-downloader",
	},
];
