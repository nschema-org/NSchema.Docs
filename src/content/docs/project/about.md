---
title: About NSchema
description: Who builds NSchema, why it exists, and what to expect from the project.
sidebar:
  order: 1
---

NSchema is a free, open-source project built and maintained by me, [Tom Wolfe](https://github.com/trwolfe13). I'm just 
another software engineer who got nerd sniped trying to solve a problem one weekend and let it get way out of hand. 
While maintaining this project isn't my full-time job, I do use it both at work and in side projects, so I'm personally 
invested in its wellbeing.

## Why?

There are plenty of database migration tools and techniques out there already, but in my experience, they never just work.
Whether it's proprietary tooling, opaque binaries, or hand-written migrations, there's always one headache or another that
makes them not fun to deal with. Compare that with how easy it is to get started managing infrastructure with [OpenTofu](https://opentofu.org/),
and that's what we deserve for our databases.

The goal of NSchema is to provide a production-grade schema management tool, with the bells and whistles expected from
modern software, while offering a slick developer experience with the lowest-possible barrier to entry.

## Project status

NSchema is currently a hobby project maintained by just me, but it doesn't have to stay that way. I use it professionally,
and in side projects, so I have a personal commitment to it regardless, but I'm open to outside feedback and contributions.
It's been said before, but I have zero interest making money off this. Our industry runs on open source software, and I 
just wanted to offer something cool that I built in the hope that it will help others as it's helped me. 

Check [GitHub](https://github.com/nschema-org/NSchema.Core/issues) for what I'm currently working on, and [Versioning & compatibility](/project/versioning/) for how I approach things 
like breaking changes (spoiler alert: it's SemVer).

## AI Disclosure
 
This project wasn't vibecoded, but I do use Claude (Opus, and more recently Fable), as both a pair programmer and workhorse. 
The architecture and design calls here are all mine (for better or worse), and anything I didn't write personally, I've 
reviewed: AI tooling is never an excuse to disregard good engineering discipline.

## License

NSchema is free and open source under the [MIT License](/project/license/).
