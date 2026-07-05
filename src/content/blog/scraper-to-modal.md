---
title: "Why we moved our rendering service off a box and onto Modal"
description: "Our PowerPoint and PDF exports render in real headless Chrome, and a single always-on box was the wrong shape for bursty, isolated export traffic. Why we moved to Modal, why not Lambda, and what the serverless rearchitecture changed."
date: 2026-06-05
tags: [scaling, serverless, modal, playwright, architecture, war-story]
---

# Why we moved our rendering service off a box and onto Modal

Our product lets people build presentations and then download them as PowerPoint or PDF files. That download button is deceptively expensive. To get an export that actually looks like what the user sees on screen, we don't try to re-implement the layout in some file-generation library. We render the real thing in a real browser, headless Chrome, and read the finished layout back out. It is the only way we've found to keep the exported file faithful to the live editor.

For a long time that browser lived in a single always-on service sitting next to our backend. A request came in, the service spun up a headless browser, loaded the deck, waited for everything to settle, extracted the layout, and handed it back. It worked fine for a good while, and then it started not to.

## The problem was the shape of the load, not the code

Export traffic is bursty. Nobody exports a deck at a gentle, predictable rate. People build for an hour and then export three times in two minutes because the first one had a typo. A whole classroom or a whole team hits the button inside the same few seconds. Then nothing for a while.

A single long-running box is the wrong fit for that shape, and you end up paying for it at both ends. When it's quiet you're paying for a machine with a lot of memory to sit there doing nothing, because headless Chrome is memory-hungry and you have to provision for the peak. When it's busy, every concurrent export is fighting the same box for the same CPU and RAM, so renders slow down together. And if one deck does something pathological and crashes the browser, it doesn't just fail that one export, it takes the shared browser down and everyone else's export goes with it.

That last bit is what actually hurt. We had a component that was, by design, a single point of failure for every download in the product, and headless browsers crash. A memory spike, or a Chromium quirk on one weird slide, and the blast radius was everybody.

We could have thrown a bigger box at it, or run a pool of them behind a queue with autoscaling rules to maintain. But that's a fair amount of standing infrastructure and ongoing tuning for a problem that is really just: this workload is spiky, and each export is independent of the others. That combination is what serverless is good at.

## What we actually wanted

Writing the requirements down made the decision straightforward. We wanted:

- **Isolation per export.** One deck's bad render should never be able to touch another user's export. Each job gets its own browser in its own sandbox.
- **Scale to zero.** When nobody is exporting, we want to be paying for nothing, not for a smaller idle box.
- **Fan out on bursts.** When ten exports land at once, ten things should run at once, instead of ten things queued behind one box.
- **Keep the browser out of the backend.** Our API server shouldn't be babysitting Chromium. Its job should be to take a request, kick off the work, and hand back a link.

That's a serverless container workload with a heavy, browser-shaped runtime. We went with [Modal](https://modal.com) because it does this without making us hand-roll the container orchestration. You describe the environment your code needs, including the browser and its system dependencies, and it gives you HTTP endpoints backed by containers that spin up per request and go away when they're done.

## A quick word on Modal, and why not Lambda

If you haven't come across it, [Modal](https://modal.com) is a platform for running code in the cloud without managing servers. What sold us on it is that you define the whole runtime in plain Python. You say "I need this image, these system packages, this browser, these files mounted," and it builds that container and runs your functions inside it on demand. You get HTTPS endpoints, per-request containers, easy fan-out, and scale-to-zero, and you never touch a Dockerfile-plus-orchestrator-plus-load-balancer stack to get there.

The obvious question is why not AWS Lambda, which is the default answer to "I want to run a function in the cloud." We did look at it, and for a lot of workloads it would have been fine. For this one it kept getting in the way.

Lambda is built around small, quick functions, and a headless browser is neither. To run Chromium on Lambda you're packaging a large custom container image, pushing it to a registry, and then wiring the function up to an API gateway and an execution role with the right IAM before a single request can reach it. None of that is impossible, but it's a fair amount of standing plumbing to maintain for what is really just "run this Python in a box that has a browser in it." Lambda also caps a single invocation at fifteen minutes. That's workable for exports today, but it's a ceiling I'd rather not be sitting under as decks get heavier.

Modal collapsed most of that. The browser image, the system fonts, the files to mount, and the HTTP entry points are all described in the same Python file as the logic, and deploying it is a single command. The scaling behavior we cared about is just how it works, rather than a set of autoscaling rules we have to keep tuned. We traded a pile of AWS glue for a short, readable definition of what each render actually needs.

## How the architecture changed

The surprise was how much smaller our backend got.

Before, the backend was tangled up with rendering. After, its role shrank to something you can say in one line: take the export request, ask the rendering service to do the work, and return a download link. All the heavy lifting, spinning up the browser, loading the deck, waiting for content, extracting the layout, building the file, moved into ephemeral containers that exist only for the length of one export.

A few decisions kept it clean:

**The browser still loads the same frontend everyone else uses.** We didn't fork the renderer for exports. The rendering containers navigate to the same public app URL a user would, drive it with the browser, and read back the result. The live app stays the single source of truth for how a slide looks, so the export can't quietly drift away from what people see in the editor.

**Finished files go straight to object storage, not back through the backend.** Rather than stream megabytes of PowerPoint back through our API, the rendering job writes the file straight to storage and we hand the user a short-lived signed link. The backend never holds the file. That keeps the API fast and stateless, and it means a 12 MB PDF isn't tying up a request thread that should be answering other calls.

**The rendering tier holds almost nothing sensitive.** The containers doing the rendering talk to the backend over HTTPS with a shared secret, and that's it. They don't carry our database credentials or our cloud account credentials. If you're running other people's content inside a browser at scale, you want that tier holding the smallest possible set of things it could leak. That boundary was a deliberate part of the design.

Once PowerPoint, PDF, and thumbnail rendering were all running on Modal and holding steady, we deleted the old always-on service. The export path now goes to Modal with no fallback, because there's nothing left to fall back to.

## The tradeoffs

Serverless has sharp edges, and this wasn't a pure win.

The main one is cold starts. A container that scaled to zero has to come up before it can do anything, and a browser image isn't small. For a user-triggered export that already takes a few seconds of real rendering work, some spin-up at the front is acceptable, but it's real, and you have to design your timeouts and your loading UI around it instead of pretending it isn't there.

You also give up a server you can SSH into for a platform you watch from the outside. When something goes wrong inside a container that no longer exists, your logs and traces are all you have. We leaned into that and tagged every render so we can follow a single export end to end after the fact, which turned out to be worth doing regardless of where the code runs.

## Was it worth it

It was. The failure mode that worried us, one bad render taking down everyone's exports, is gone, because there's no longer a shared thing to take down. Idle cost dropped to roughly nothing. Bursts of exports run side by side now instead of stacking up behind each other. And the backend got simpler, which keeps paying off every time we touch that code.

The thing I keep coming back to is that we never really had a code problem, we had a fit problem. The rendering logic was fine. It was just living in the wrong shape of infrastructure for the way people actually used it.
