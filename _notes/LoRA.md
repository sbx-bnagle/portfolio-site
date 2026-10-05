---
title: "Garden LoRA"
date: 2026-01-02
---

I learned about LoRAs while helping Grow Good Gardens, my wife&rsquo;s planting design practice, find a better way to render gardens for clients.

There were two common approaches, and neither was a great fit. Landscape architecture rendering software is costly and complicated, more than the typical Grow Good Gardens needs. Digital photo collages are quick and cheap, but they don&rsquo;t look great, and they don&rsquo;t give clients a good sense of what the finished garden will look like.

After some trial and error, we found an approach that works. We built a library of plant &ldquo;stamps,&rdquo; cut-out photos of plants that can be arranged into a collage of the planned garden. The collage then goes through an image generator, which redraws it in the practice&rsquo;s house style: &lsquo;Gnome Fog Lite&rsquo;.

To get the same style every time, we trained a LoRA. Short for low-rank adaptation, a LoRA is a small add-on to an image model, trained on a set of example images, that teaches the model one specific thing. Here, that&rsquo;s a look. Because it adjusts a large model rather than replacing it, a LoRA is quick to train and small enough to keep alongside the project files. The payoff is consistency: every rendering comes out in the same style, without long prompts or rerolling until something looks right. And since the collage sets out the plants and the layout, the generator changes how the garden looks, not what&rsquo;s in it.

Now Grow Good Gardens is able to deliver polished design documents that represent both the brand and the garden, quickly and efficiently.

{% include media-full.html
	src="notes/lora1.png"
	alt="Painterly rendering in soft, grainy color of pink coneflowers, orange flower clusters and pale feather grasses."
%}

{% include media-duo.html
	src_a="notes/lora2.png"
	alt_a="Washed-out rendering of a meadow-style bed with blue-green grasses, lavender flower spikes and white blooms."
	src_b="notes/lora4.png"
	alt_b="Close rendering of tall, thin stems topped with small purple flower clusters against a peach background."
%}

{% include media-full.html
	src="notes/lora6.png"
	alt="Rendering of a narrow curbside planting strip with tall grasses, dark red button flowers and lavender mounds beside a sidewalk."
%}
