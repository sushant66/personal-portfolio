---
title: "How I cached a theme list so well nobody could see new themes"
description: "A caching war story: how a one-line max-age header hid every new theme for a month, why the fix was worse than the bug, and how ETags and conditional revalidation actually solve it."
date: 2026-04-30
tags: [http-caching, etag, debugging, war-story]
---

# How I cached a theme list so well nobody could see new themes

Every time someone opened the theme picker on my app, the browser went back to the server for the full list of themes. It's a mostly-static list, so re-fetching it on every single page load always felt a little dumb. One afternoon I decided to fix it.

I added one line. I told the browser to cache the response for 30 days.

```python
# Themes are mostly static, cache for 1 month
return JSONResponse(
    content=data.model_dump(mode="json"),
    headers={"Cache-Control": "public, max-age=2592000"},  # 30 days
)
```

Deployed it, watched the network tab, saw the theme list load instantly from cache on the second visit. Great. Moved on.

A week later I shipped a bunch of new themes, changed how they were grouped, and reshaped the API response. Then I opened the app to check it and saw the old themes and the old layout. I hard-refreshed. Same thing. I checked that prod was actually running the new code. It was. I hit the API directly in a new tab, and the new themes were right there in the JSON.

So the data was fine and the server was fine. It was the browser, serving me a copy of the list it had decided was good until roughly next month. My own optimization was doing exactly what I'd told it to do, which is the most annoying kind of bug to chase.

## Why the "fix" was worse than the thing it fixed

`Cache-Control: max-age=2592000` tells the browser: this response is good for 30 days, don't even bother asking me again. And the browser takes that completely literally. Once it has a copy, it never contacts the server for the whole month. It just serves the file off disk.

That's genuinely great for stuff that never changes. It's a landmine for stuff that changes on *my* schedule but lives at a URL that never changes.

The real problem had been staring at me the whole time, and it was the URL. `GET /themes/list` always means "the current list of themes," but what "current" is changes every time I add a theme, edit one, or ship a deploy that reshapes the payload. `max-age` is a promise about time: good for N seconds. What I actually needed was a promise about content: good until the list changes. And I had no way of knowing, in advance, when that would be.

I went through the usual bad ideas first:

- **Just lower the TTL.** `max-age=60`? Now I'm re-fetching every minute and still stale for up to a minute after every change. That's the same bug in a smaller font.
- **Add a version to the URL.** `?v=2` works, but now I have to remember to bump it every time I touch a theme, and every client has to somehow learn the new number. The first time I forget, everyone's stale again.

The actual answer was to stop hard-caching a URL whose content moves, and let the browser ask instead, but ask cheaply. That's what ETags are for.

## Two kinds of caching, and I picked the wrong one

There are roughly two situations you cache for, and I'd reached for the wrong one without really thinking about it.

**Hard-caching** is for URLs where the content behind them never changes. The classic version is a versioned filename like `app.4f9a3c.js`, where the hash is the content, so if the content changes the filename changes too. You can cache that forever with no risk, because a new version is a new URL, and the browser never has to check.

**Revalidation** is for URLs that stay the same while their content shifts underneath them. The browser keeps its copy, but on every load it checks in with the server: is what I've got still current? If yes, the server says use yours, in a tiny response with no body. If no, it sends the new version.

My theme list is the second kind. Same URL forever, contents changing whenever I add a theme. I'd been treating it like the first.

## How ETags actually work

An ETag ("entity tag") is just a fingerprint of a response. The flow is a two-line conversation:

1. The server sends the list along with a header like `ETag: "abc123"`.
2. Next time, the browser sends that fingerprint back in an `If-None-Match: "abc123"` header.
3. The server works out the current fingerprint. If it matches, it replies `304 Not Modified` with an empty body, meaning use your copy. If it doesn't, it sends the fresh list and a new ETag.

So when nothing has changed, the response is basically just headers, with no payload and barely any bytes. And the moment something does change, the next load picks it up. No staleness window, and no version number to babysit.

## Doing it without making every request slow

The one thing you can't do is build the entire response just to decide whether to send it, because that throws away half the point of the `304`. So the fingerprint has to be cheaper than serializing the whole list.

For a list backed by a database there's a cheap trick: fingerprint it with the row count plus the latest `updated_at`. Add a theme and the count changes. Delete one and it changes. Edit one and `updated_at` bumps, which the ORM does for me on every write. That's one small aggregate query with no rows actually loaded:

```python
async def get_themes_version(session: AsyncSession, public_only: bool = True) -> str:
    """
    A cheap fingerprint of the theme catalog for ETag/conditional caching.

    Derived from row count + the latest updated_at, so it changes whenever a
    theme is added, removed, or edited. Avoids serializing every theme just to
    decide a 304.
    """
    query = select(func.count(Theme.id), func.max(Theme.updated_at))
    if public_only:
        query = query.where(Theme.is_public.is_(True))
    count, latest = (await session.execute(query)).one()
    latest_str = latest.isoformat() if isinstance(latest, datetime) else str(latest)
    return f"{count}-{latest_str}"
```

Then the route computes the ETag *first* and bails out with a `304` before it ever touches the expensive fetch-and-serialize path:

```python
@router.get("/list", response_model=ThemeListResponse)
async def list_themes(
    request: Request,
    public_only: bool = True,
    include_css: bool = False,
    session: AsyncSession = Depends(get_session),
):
    # Cheap fingerprint first, lets us 304 before the expensive fetch/serialize.
    # include_css/public_only change the payload, so they're part of the ETag.
    version = await theme_service.get_themes_version(session, public_only)
    raw = f"{version}:public={public_only}:css={include_css}"
    etag = '"' + hashlib.sha1(raw.encode()).hexdigest() + '"'
    cache_headers = {"Cache-Control": "no-cache", "ETag": etag}

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=cache_headers)

    themes = await theme_service.get_all_themes(session, public_only)
    # ... build the response model ...
    data = ThemeListResponse(themes=theme_responses, total=len(themes))
    return JSONResponse(content=data.model_dump(mode="json"), headers=cache_headers)
```

Two things here that I'd have gotten wrong if I hadn't stopped to think about them.

The query params are part of the fingerprint. `include_css` and `public_only` change what the response actually contains, so two requests that differ only in those need different ETags, or you'd hand back the wrong cached shape.

And the header I reached for is `Cache-Control: no-cache`, which, confusingly, does not mean "don't cache." It means "store it, but check with me before you reuse it," which is exactly the behavior I want. The header that actually means "never store this" is `no-store`. I mix these two up basically every time, so for my own sake: `no-cache` is revalidate, `no-store` is don't keep it at all.

## The part that nearly broke me

I shipped the ETag fix, opened the app, and still saw the old themes.

For a few minutes I was convinced the whole approach was wrong. It wasn't. It was my first fix coming back to haunt me. Every browser that had already hit the old endpoint was still sitting on a `max-age=30d` entry that, as far as it was concerned, was fresh for another few weeks. So those browsers had no reason to make a request at all, which meant they never reached the new ETag logic. My fix was correct and completely invisible to exactly the people who'd hit the original bug.

The escape hatch was on the client. I made the frontend force a revalidation on the next fetch, which blows past any stale `max-age` entry already sitting in the browser:

```ts
const response = await this.authenticatedFetch(
  `${this.baseURL}/api/themes/list?public_only=${publicOnly}&include_css=${includeCss}`,
  // Always revalidate via the server's ETag instead of trusting a stored copy.
  // This bypasses any legacy `max-age` entry already in the browser cache (so
  // the shape change / facet updates land immediately) while still getting
  // cheap 304s when the catalog is unchanged.
  { cache: 'no-cache' }
);
```

One deploy later, every client was revalidating against the ETag and the old 30-day copies were gone.

The thing I took away from this is that caching bugs have a long tail. The moment you ship a bad `max-age`, you've committed every browser that sees it to that decision for the full duration, and fixing the server doesn't reach back and fix the copies you already handed out. Sometimes you have to actively nudge the client to drop what it's holding.

## Where it landed

The theme picker still loads instantly on repeat visits. The server barely does any work when nothing has changed, just one fingerprint query and an empty `304`. And new themes show up the moment I ship them, which was the entire thing I'd broken in the first place.

Looking back, the fix wasn't really about ETags. It was about noticing I'd been answering the wrong question. I'd put all my effort into "how long is this good for?" when the question was always "has this changed?"

---

*If you want to go deeper: MDN's [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) and [ETag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag) pages are the clearest references, and [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111) is the actual HTTP caching spec.*
