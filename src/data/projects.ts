export type Project = {
	title: string;
	subtitle: string;
	description: string;
	tags: string[];
	link: string;
};

export const projects: Project[] = [
	{
		title: "Marketing Assistant & Web Maintainer",
		subtitle: "Luther College, Decorah, IA",
		description:
			"I produce and publish multi-platform content for the college — press releases, blog posts, social media, and newsletters — and conduct interviews and manage editorial calendars to align coverage with institutional priorities. I also build and maintain responsive UI components and manage content updates for the computer science department's web resources, serving 1,400+ students.",
		tags: ["Web Development", "Content", "Editorial", "UI"],
		link: "",
	},
	{
		title: "Research Assistant",
		subtitle: "University of Idaho – Data Analytics & Vision Lab (IAMP)",
		description:
			"As a research assistant at the University of Idaho's Data Analytics & Vision Lab, I wrote Python scripts to clean and process over 50,000 rows of agricultural sensor data, feeding it into PostgreSQL for downstream analysis. I trained crop-yield prediction models with Scikit-learn and iterated on feature selection to improve NDCG scores by 15% over baseline, and deployed OpenCV-based image processing pipelines on Raspberry Pi devices for field-level time-series data collection.",
		tags: ["Python", "Scikit-learn", "PostgreSQL", "OpenCV", "Research"],
		link: "",
	},
	{
		title: "IT Technician & Volunteer",
		subtitle: "Chain For Change – Project Wings to Dreams, Nepal",
		description:
			"I designed and 3D-printed tactile learning models for visually impaired students using Blender and OpenCV for shape calibration, and our work earned coverage in national newspapers. I also authored concept papers on inclusive educational technology and collaborated with accessibility teams to iterate on physical prototypes based on student feedback.",
		tags: ["3D Printing", "Blender", "OpenCV", "Education"],
		link: "",
	},
	{
		title: "Full-Stack Developer",
		subtitle: "Scalebit Technologies, Kathmandu",
		description:
			"I built an offline-capable mobile learning app serving over 5,000 users using React Native and a local-first data sync architecture. I also implemented interaction logging with Node.js and Express, tracking dwell-time and click-through rates to inform content ranking.",
		tags: ["React Native", "Node.js", "Express", "Mobile"],
		link: "",
	},
	{
		title: "Video Editor",
		subtitle: "Content Creation",
		description:
			"I created core videos on gaming and philosophy, emphasizing motion graphics, color grading, and sound design using tools like Premiere Pro, DaVinci Resolve, and Photoshop while honing my writing skills.",
		tags: ["Premiere Pro", "DaVinci Resolve", "Photoshop"],
		link: "",
	},
	{
		title: "Class 12 NEB Science Guide",
		subtitle: "Cross-platform mobile study app",
		description:
			"I shipped a cross-platform mobile study app to the Google Play Store with 10K+ downloads and a 4.2★ rating, covering Physics, Chemistry, and Biology for Nepal's national exam board. I architected a local-first data sync system with React Native for offline access, and built interaction logging via Node.js and Express to track engagement and inform content ranking.",
		tags: ["React Native", "Node.js", "Express", "Mobile"],
		link: "https://play.google.com/store/apps/details?id=com.guide.nebtwelve",
	},
	{
		title: "INFINI8",
		subtitle: "Browser-based infinite driving experience",
		description:
			"A Three.js infinite procedural driving experience where the road never ends. Terrain, road curvature, and atmosphere are all generated in real time via fractional Brownian motion with no loading pauses. I integrated the Spotify Web Playback SDK to stream music in-game with live synced lyrics rendered on screen in any language, and engineered full vehicle physics, 7 camera modes, and 4 dynamic weather states. Runs fully in the browser on desktop and mobile with no install.",
		tags: ["Three.js", "JavaScript", "Spotify Web SDK", "Procedural Generation"],
		link: "https://infini8.sandeshbhandari.com/",
	},
	{
		title: "Bee My Baby",
		subtitle: "Pure CSS 3D animation",
		description:
			"A small experiment in 3D without any libraries: a bee built from cube faces dances around a spinning Minecraft grass block topped with a rose, all in sync to the song Bee My Baby. Just HTML, CSS transforms, and a few lines of JavaScript to start the music.",
		tags: ["CSS 3D", "Animation", "HTML", "JavaScript"],
		link: "https://beemybaby.sandeshbhandari.com/",
	},
	{
		title: "FilmRecs",
		subtitle: "Movie recommendation engine",
		description:
			"A movie recommendation engine that builds a user taste profile and ranks the closest matches across 3,652 films using TF-IDF vectorization and cosine similarity. I preprocessed and vectorized movie metadata — genres, descriptions, tags — with Pandas and Scikit-learn to generate the sparse feature matrices used for similarity scoring. Deployed as a live demo on Hugging Face Spaces.",
		tags: ["Python", "Scikit-learn", "Pandas", "TF-IDF", "ML"],
		link: "https://huggingface.co/spaces/sandeshbhandari/FilmRecs",
	},
	{
		title: "Nonsense CS Research Gen",
		subtitle: "Fake academic CS paper generator",
		description:
			"Type your name, get back a real-looking two-column PDF of a fake CS paper. Your name is hashed into a deterministic seed that picks your university from a list of 1000 ranked institutions, generates co-authors from a 4921 name dictionary, and chooses vocabulary biased by real interview frequency data scraped from 416 companies. Includes matplotlib charts, a comparison table, 12 fake references named after real algorithm inventors, and a programmer joke buried in the abstract.",
		tags: ["Python", "ReportLab", "Matplotlib", "PDF Generation"],
		link: "https://github.com/sandesh-8622/nonsense-cs-research-gen",
	},
	{
		title: "medium2pdf-scraper",
		subtitle: "Archive a Medium author's full back catalog",
		description:
			"A command-line tool that scrolls a Medium profile, finds every article ever published, renders each one as a clean searchable PDF, then merges everything into a single bookmarked PDF inside a zip. Drives a real Chrome instance via Playwright to get past Cloudflare bot checks. Built for feeding an author's full body of work into an LLM for personal research.",
		tags: ["Python", "Playwright", "PDF", "Web Scraping"],
		link: "https://github.com/sandesh-8622/medium2pdf-scraper",
	},
	{
		title: "Posture Coach",
		subtitle: "Real-time posture monitor with webcam",
		description:
			"A real-time posture monitoring tool that watches how you sit using OpenCV, MediaPipe, and webcam input. It scores your posture from 0 to 100 by measuring forward head angle, shoulder tilt, spine lean, and neck compression every frame, sends desktop alerts when posture stays bad too long, and displays a live tracking dashboard built with Flask, including a weekly heatmap and history chart. Runs entirely locally with no cloud dependency.",
		tags: ["Python", "OpenCV", "MediaPipe", "Flask", "Computer Vision"],
		link: "https://github.com/sandesh-8622/posturecoach",
	},
	{
		title: "Subreddit Image Downloader",
		subtitle: "Bulk download from any public subreddit",
		description:
			"A Node.js CLI that bulk downloads images, GIFs, and videos from any public subreddit using Reddit's public JSON API and packages them into a zip file. No login, OAuth, or API key required. Handles gallery posts with multiple images, supports filtering by sort and time window, and has an images-only mode that skips GIFs and videos.",
		tags: ["Node.js", "JavaScript", "CLI", "Reddit API"],
		link: "https://github.com/sandesh-8622/subreddit-image-downloader",
	},
];