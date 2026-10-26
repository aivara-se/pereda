# Pereda

A real-time daily note app for the desktop: one page per day, written as you type. macOS, Windows and Linux, in about 6 MB, with no account, no server and no network.

The product is [PRODUCT.md](PRODUCT.md); the architecture is [SYSTEMS.md](SYSTEMS.md); the decisions are in [docs/adrs](docs/adrs/).

## Run it

```sh
tinyjs dev      # the app, with hot reload
bun test        # the store, the day and the export
tinyjs build    # the app for this OS
```
