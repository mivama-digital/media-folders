# Virtual Media Folders

Virtual folder organization for the WordPress Media Library without moving files on disk or changing media URLs.

This repository is the **Mivama Digital maintained distribution** of Virtual Media Folders. It is based on the original [`soderlind/virtual-media-folders`](https://github.com/soderlind/virtual-media-folders) project created by Per Søderlind. Original authorship, copyright notices, Git history, and GPL licensing are intentionally preserved.

> **Maintenance model:** Mivama maintains its own roadmap, releases, CI, support process, and repository governance. Relevant upstream changes may be reviewed and adopted deliberately; upstream is not merged automatically.

## Features

- Hierarchical virtual folders for the WordPress Media Library
- Drag-and-drop organization without filesystem moves
- Media Library and block editor integration
- Bulk move actions
- Keyboard and screen-reader accessibility support
- Translation-ready UI
- Extensible taxonomy, REST, and add-on APIs

## Requirements

- WordPress 6.8+
- PHP 8.3+

## Installation

### Mivama release

1. Open the [Mivama releases](https://github.com/mivama-digital/media-folders/releases) page.
2. Download the `virtual-media-folders.zip` asset from the desired release.
3. In WordPress, go to **Plugins > Add New > Upload Plugin**.
4. Upload the ZIP and activate the plugin.

The original project is also published at [WordPress.org](https://wordpress.org/plugins/virtual-media-folders/). The Mivama repository does not treat that listing as its deployment target unless WordPress.org release ownership and credentials are explicitly configured for Mivama.

## Usage

### Organize media

1. Go to **Media > Library**.
2. Open the folder sidebar.
3. Create folders with **+**.
4. Drag media into folders or use the bulk **Move to Folder** action.
5. Select a folder to filter the media view.

### Settings

Go to **Media > Folder Settings** to configure sidebar visibility, uncategorized media, move behavior, and the default upload folder.

## Development

Install dependencies:

```bash
npm ci
composer install
```

Run the JavaScript test suite:

```bash
npm test -- --run
```

Run the PHP test suite:

```bash
composer test
```

Build production assets:

```bash
npm run build
```

Pull requests should pass the repository CI before merge. See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## Versioning and releases

Mivama **continues the existing plugin version lineage** instead of resetting the plugin to `1.0.0`. Resetting the version would create incorrect downgrade/update semantics for installations already using the `virtual-media-folders` plugin slug.

Release policy:

- semantic versions use `vX.Y.Z` Git tags;
- GitHub releases produce `virtual-media-folders.zip`;
- release builds must pass JavaScript tests, PHP tests, and the production build;
- WordPress.org deployment is a separate, explicit operation and is not triggered by every Git tag.

## Documentation

- [Documentation index](docs/README.md)
- [Accessibility](docs/a11y.md)
- [Development](docs/development.md)
- [Hooks](docs/hooks.md)
- [Add-on development](docs/addon-development.md)
- [Upstream relationship](UPSTREAM.md)
- [Security policy](SECURITY.md)

## Upstream and attribution

Virtual Media Folders was created by **Per Søderlind**. Mivama's repository preserves that origin rather than relying on GitHub's `forked from ...` banner as the only attribution mechanism.

For the maintenance policy, synchronization rules, and attribution details, see [UPSTREAM.md](UPSTREAM.md).

## License

Licensed under **GPL-2.0-or-later**. See [LICENSE](LICENSE) for the repository license notice.

Original Virtual Media Folders copyright remains with its respective author(s). Subsequent Mivama changes remain subject to the same GPL-compatible licensing requirements.