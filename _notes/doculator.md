---
title: "Doculator"
date: 2026-01-03
---

The idea came from a post by LaCroix Design Co, a fellow Chicago studio, on [how they streamlined their proposal writing](https://medium.com/lacroix-design-co/streamlining-our-proposal-writing-process-fad7542ded10). It got me thinking about how we put ours together at Sandbox, and The Doculator grew out of that: documents written in Markdown, with boilerplate sections pulled in from their own files, and a stylesheet that keeps everything consistently branded.

I started with [Marked 2](https://marked2app.com/), which previews Markdown and can pull in other files. In the end I preferred [iA Writer](https://ia.net/). Its way of including one file in another is cleaner, and I found switching between writing and the finished preview easier. Marked 3 could be better, but I haven&rsquo;t tried it yet.

The key feature in both is that a CSS theme handles the design. Writers who don&rsquo;t design never have to learn a tool like InDesign, and designers don&rsquo;t have to stop and typeset a quick two-pager. It helped with docs beyond the proposals. When maintaining documents' style became accessible to the whole group all our client-facing documents became much more polished and consistent.  

It&rsquo;s also aged well. AI tools write Markdown easily, so they can draft straight into the system. And because the theme handles the design and the app makes the PDF, there&rsquo;s no need to ask the AI to lay anything out or build a file, which is slow and costly in tokens. iA Writer has a feature where text inputs are color-coded which makes it easy to see what has been reviewed and updated by the team from the original generated draft.

Next, I&rsquo;m hoping for a way to set variables for a document, like a publish date set ahead of time, and use them throughout the text, much like front matter in a static site generator. iA Writer doesn&rsquo;t currently offer this feature, and possibly at this point it&rsquo;s worth building my own tool.

{% include media-full.html 
	src="notes/doculator.png" 
	alt="Two pages of a Doculator document. The cover has a magenta wave logo, the title &lsquo;Getting started&rsquo; and the subtitle &lsquo;A step-by-step guide to setting up the site audit tool without installing anything or opening a terminal.&rsquo; Beside it, page 7 continues the steps, with headings, settings tables and code, and a footer with the date and Sandbox Studio, Chicago."
	caption="The cover and a page of steps from a setup guide, written in Markdown and styled by the studio&rsquo;s theme"
%}
