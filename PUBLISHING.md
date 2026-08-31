# Publishing the window

The page and the world fail separately, and that is the whole point. A pillar is
one machine. If it goes down the world does not — other sovereign peers are
computing it right now — but until the page lives somewhere else, there is
nowhere to load a client from to look at it.

This publishes the client to GitHub Pages, on a domain you own, from the same
repository the source lives in.

---

## Once

**1. Point the subdomain at GitHub Pages.** At your DNS provider, on
`interval.place`:

    Type: CNAME     Name: play     Value: intervalplace.github.io.

(The trailing dot matters on some providers. Use `www`-style CNAME, not an A
record — Pages changes IPs.)

**2. Turn on Pages.** In the repository: **Settings → Pages → Build and
deployment → Source: GitHub Actions.** Not "Deploy from a branch."

**3. Push the workflow.**

    git add .github/workflows/publish-window.yml build-window.mjs
    git commit -m "publish the window to Pages"
    git push

**4. Set the custom domain.** Settings → Pages → Custom domain →
`play.interval.place` → Save. Tick **Enforce HTTPS** once the certificate is
issued (a few minutes; it will look broken until then, which is normal).

The build writes a `CNAME` file into `dist/` on every run. Pages *deletes* the
custom domain setting if a deploy arrives without one, so this is not optional
and not something to commit by hand.

**5. Check it.**

    curl -sL https://play.interval.place/index.html | shasum -a 256
    node build-window.mjs --domain=play.interval.place && cat dist/index.html.sha256

Two identical hashes mean the published page is the page in this repository, and
nobody has to take anyone's word for anything.

---

## Afterwards

Pushing a change to `window-web.html` republishes. Nothing else triggers it — a
docs commit should not move an 811 KB file.

To publish by hand, or with different fallback nodes:

    Actions → publish window → Run workflow

## peers.json

The file beside the page. It is how a fresh browser on a public machine finds a
live node when every baked address is down, and it shares a failure domain with
the PAGE rather than with the world — if you can load the window, you can load
the list.

The build will not overwrite one that already exists, so edit
`dist/peers.json`, commit it, and it survives every rebuild. Put more than one
address in it as soon as you have more than one node:

```json
{
  "nodes": [
    "https://interval.place",
    "https://second-pillar.example",
    "https://a-friends-door.example"
  ]
}
```

Any peer of the world will do. A door somebody runs at home is as good an
answer as a pillar, and the window checks the worldId before trusting either.

## The other half

A second node, so that list is not one address:

    INTERVAL_PUBLIC=https://second-pillar.example node join.mjs second

`INTERVAL_PUBLIC` is the address a *browser* can reach it on. Without it a peer
joins the mesh and is invisible to windows, because a multiaddr is not something
a page can dial.
