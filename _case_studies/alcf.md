---
title: "Argonne Leadership<br>Computing Facility"
subtitle: "Unified visual system for a supercomputing facility, from printed reports to live machine status"
blurb: "A decade-long relationship spanning the website, annual and online reports, posters, and print, all in one coherent visual system."

role: "Print and web design, development"
year: "2016–present"
team: "Brad Nagle, Matt Stone, Aaron Grant, <a href='https://www.bethcerny.com/'>Beth Cerny</a>"
scope:
- strategy:
    - "content strategy"
    - "information architecture"
    - "user experience"
- branding:
    - "identity systems"
    - "information visualization"
- interactive:
    - "interface design"
    - "front-end development"
    - "back-end development"
    - "responsive and mobile design"
    - "real-time data visualization"
- print:
    - "publications"
    - "branded materials"
    - "marketing collateral"

status: "Live"
live_url: "https://www.alcf.anl.gov"
hero: "/assets/img/ALCF/hero-5x2.jpg"
hero_video: "/assets/video/alcf-reports.mp4"
hero_aspect: "5 / 2"
hero_loop: false
hero_alt: "A decade of ALCF annual and science reports dropped into a stack on a wooden table, their spines fanned so each year is legible."
hero_caption: ""
case_tint: "#f3f6f8"
card_media: "<img src='/assets/img/ALCF_B.jpg'>"
card_aspect: "16:9"
# Alt text for the sharing image (assets/img/og/alcf.jpg, made by npm run social).
og_alt: "Cover of the ALCF 2019 science report: the word Science over a blue and pink scientific visualization, with the Argonne logo."
---

The Argonne Leadership Computing Facility runs some of the world’s most powerful supercomputers built for open science. At Sandbox, our job is to make the facility clear to everyone it serves: the scientists who apply for time on the machines, the public who funds them, and the staff who keep it all running. We started with the reports in 2016 and grew into ALCF’s de facto in-house design team, usually with several projects under way at once. I lead design across print and online. I designed the site and built its live machine-status graphics, and I designed and implemented the system behind the user documentation, which the scientists write themselves. On strategy and UX, I work alongside Beth Cerny, ALCF’s communications lead.


{% include scope.html %}





## The result

The site relaunched in 2020, and it&rsquo;s the clearest measure of the work. From 2023, when reliable analytics begin, to 2025, active users grew from 40,000 to 151,000, nearly four times in two years.

{% include stats.html
   n1="4x" l1="Active users on the site, 2023 to 2025"
   n2="151K" l2="Active users on the site, 2025" %}



## Building a brand one report at a time

ALCF had no budget or appetite for a full branding process, so the brand grew out of the reports instead. Each year brought a new annual report and science report, and each one let us show what a consistent look could do, rather than ask for sign-off on a brand up front. A few pieces carried from year to year: the ALCF letterforms and the year drawn in diagonal rules, a strip of scientific visualization down each cover’s edge, and bold single-color contents pages. That consistency won people over, and the look spread to posters, infographics, and event banners.

The reports changed too. The science report stays in print, but the annual report moved online, where it reaches more than the few who were lucky enough to land a printed copy.


{% include media-full.html
   src="ALCF/ar.jpg"
   alt="Two printed ALCF Annual Reports side by side on a wood table: 2018 in dark navy with the ALCF letterforms drawn in diagonal rules, 2020 in bright blue with the year drawn the same way, each with a strip of scientific visualisation down its outer edge." %}

{% include media-full.html
   src="ALCF/sr.jpg"
   alt="Two printed ALCF Science reports side by side on a wood table: the 2019 cover carrying a purple and orange fluid simulation threaded with cyan rods, the 2020 cover a dense field of red particles with pale clusters running through it." %}

{% include media-duo.html
   src_a="ALCF/z_edit/toc-01.jpg"
   alt_a="A printed ALCF annual report opened to its contents: a full-bleed visualisation of red and gold filaments swirling through blue on the left page, facing a bright blue contents page headed &lsquo;2021 Annual Report&rsquo;."
   src_b="ALCF/z_edit/toc-02.jpg"
   alt_b="A printed ALCF annual report opened to its contents: a visualisation of a silver cone against a red and grey field on the left page, facing a deep maroon contents page." %}

{% include media-duo.html
   src_a="ALCF/z_edit/info-01.jpg"
   alt_a="A printed ALCF science report spread on a wood table: &lsquo;Accessing ALCF Resources for Science&rsquo; on a dark blue page, facing donut charts of INCITE and ALCC node hours broken down by research domain."
   src_b="ALCF/z_edit/info-03.jpg"
   alt_b="A printed ALCF annual report spread in solid blue: &lsquo;Awarding Compute Time on ALCF Resources&rsquo;, facing the year&rsquo;s allocated hours, 3.78 billion and 1.86 billion, over bar charts by domain." %}

{% include media-duo.html
   src_a="ALCF/z_edit/spread-01.jpg"
   alt_a="A printed ALCF report spread in dark blue: &lsquo;Polaris Kicks Off Exascale Era Computing at ALCF&rsquo;, with two columns of text facing a photograph of the machine&rsquo;s illuminated racks and a molecular visualisation in red and blue."
   src_b="ALCF/z_edit/spread-04.jpg"
   alt_b="A printed ALCF report spread: &lsquo;ALCF Resources Contribute to Fight Against COVID-19&rsquo; on a pale pink page, facing a full-page simulation of a SARS-CoV-2 virion, its red spike proteins picked out in cyan." %}

{% include media-duo.html
   src_a="ALCF/z_edit/spread-02.jpg"
   alt_a="A printed ALCF science report spread: a deep maroon page reading &lsquo;The ALCF is accelerating scientific discoveries in many disciplines&rsquo;, facing a full-bleed simulation of red and white forms threaded with a dense blue filament."
   src_b="ALCF/z_edit/spread-03.jpg"
   alt_b="A printed ALCF science report spread in black and cyan: a photograph of the Aurora cabinets with the machine&rsquo;s name across them, facing its system specifications: greater than 1 exaflop, more than 10 petabytes of memory." %}





## A refresh for the exascale era

The previous site dated to 2011, and we rebuilt it as the facility moved into the exascale era. It serves two audiences: researchers managing their computing campaigns and reading documentation, and a public that comes for the science. I designed it so each gets straight to what it came for.

The home page shows a live status graphic for each of the four machines, Aurora, Polaris, Sophia, and Crux: whether it’s up, how many jobs are active, queued, and reserved, and how many nodes are in use. The machine-status page goes deeper, into the running jobs themselves. I built these in d3.js from live JSON feeds, one per machine, so the page works less like a brochure and more like an instrument panel.


{% include media-full.html
   video="/assets/video/alcf-allocations.mp4"
   autoplay=true
   alt="The ALCF allocation programs page scrolling on a laptop in a machine hall: the INCITE and ALCC programme cards, the awarded projects by domain, and the Get Started banner." %}

{% include media-full.html
   video="/assets/video/alcf-d3.mp4"
   autoplay=true
   alt="The live status panel for Crux: running jobs, nodes and usage beside a bar chart of nodes in use per project, with the queue below. Hovering a bar swaps the left-hand readout for that project&rsquo;s name, node count, run time and hours remaining." %}




## A system others can build on

Much of what ALCF publishes is written by many hands, so we built the tools around the writers. The annual report and the user documentation both run on GitHub-based workflows. Contributors, including the scientists who write the docs, draft and revise in one place, and the design holds no matter who’s writing.

The brand reaches past the main site, too. It’s packaged as a theme, and ALCF’s sub-organizations run their own sites on it, each with a home of its own that still reads as ALCF.

The work keeps growing. We’re bringing more animation, video, and interactive graphics into it. Argonne is also building its next generation of systems for the Department of Energy’s Genesis Mission, among them Solstice, powered by 100,000 NVIDIA GPUs. As each one comes online, it gets a feed and a status panel of its own.


{% include media-duo.html
   video_a="/assets/video/alcf-lcrc-systems.mp4"
   autoplay_a=true
   alt_a="The Systems page of Argonne&rsquo;s Laboratory Computing Resource Center scrolling on the same laptop: the title and introduction, the current resources Improv, Bebop, Swing and Storage, then Purchasing Resources and the retired Blues, Fusion and Jazz clusters, down to the footer. A compact header stays pinned to the top once the full one scrolls away."
   video_b="/assets/video/alcf-ar24.mp4"
   autoplay_b=true
   alt_b="The 2024 ALCF annual report scrolling on the same laptop: the cover, the Features and Insights sections, and the table of contents." %}

{% include media-quad.html
   src_a="ALCF/z_banners/green-01.jpg"
   alt_a="An ALCF event banner in teal: &lsquo;LANS Seminar: 09/13/2025, The Effect of Architecture During Continual Learning, 240 Room 4301, 12&ndash;2pm CT&rsquo;, beside a green checkerboard and a portrait of Allyson Hahn of Northern Illinois University."
   src_b="ALCF/z_banners/dark-02.jpg"
   alt_b="An ALCF event banner in black: &lsquo;Webinar: 09/13/2025, ParaView: Scientific Data Analysis and Visualization Training, virtual, 2&ndash;4pm CT&rsquo;, beside a pale green lattice of triangles and nodes."
   src_c="ALCF/z_banners/cyan-02.jpg"
   alt_c="An ALCF event banner in bright blue: &lsquo;Fellow Seminar: 11/03/2026, My Path in Hardware Software Co-Design and High Performance Computing, virtual, 6:30&ndash;9pm CT&rsquo;, beside a portrait of Michael Papka, ALCF director."
   src_d="ALCF/z_banners/warm-01.jpg"
   alt_d="An ALCF event banner in deep maroon: &lsquo;Ask ALCF: 08/26/2026, An Intelligent HPC User Support System in the Age of AI, virtual, 11am&ndash;12pm CT&rsquo;, beside a pink and blue lattice of triangles and nodes." %}

{% include media-quad.html
   src_a="ALCF/z_banners/cyan-01.jpg"
   alt_a="An ALCF event banner in bright blue: &lsquo;Fall Training Series: 07/27/2026, Argonne Training Program for Extreme-Scale Computing, 240 Room 1416, 5&ndash;7:30pm CT&rsquo;, beside a blue checkerboard and a dark visualisation."
   src_b="ALCF/z_banners/warm-02.jpg"
   alt_b="An ALCF event banner in deep maroon: &lsquo;Bootcamp: 08/09/2025, Argonne Introduction to HPC Bootcamp, Q Center, 12&ndash;3pm CT&rsquo;, beside a red striped pattern and a portrait of Huihuo Zheng of the ALCF."
   src_c="ALCF/z_banners/green-02.jpg"
   alt_c="An ALCF event banner in teal: &lsquo;Spring Training: 08/22/2025, Best Practices for Coupling Simulation on ALCF Systems, TCS Conference Room 1404, 2&ndash;4pm CT&rsquo;, beside blocks of graded green."
   src_d="ALCF/z_banners/dark-01.jpg"
   alt_d="An ALCF event banner in black: &lsquo;ALCF On-Demand: 12/02/2025, Experiment-Time Computing with Globus Tools, virtual, 1&ndash;2pm CT&rsquo;, beside a pale green checkerboard flecked with blue."
    %}


