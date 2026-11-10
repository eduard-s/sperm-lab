# Release and deployment

## Prepare the package

1. Install the locked development dependencies.

```sh
npm ci
```

2. Run the release tests.

```sh
npm test
npm run typecheck
npm run test:package
npm run build:demo
```

3. Examine the demo on desktop and phone widths.
4. Examine all 12 factors and their source links.
5. Examine pointer input, keyboard input, reduced motion, and pause behavior.
6. Examine the archive before publication.

```sh
npm pack --dry-run
```

The archive includes `dist`, the license, the README, and the guides.
It excludes development dependencies, local output, and secrets.
Commit `dist` with its source.

## Publish to npm

Use the npm account that owns the package.
Complete the npm authentication prompt when the registry requests it.

```sh
npm whoami
npm publish --access public
npm view sperm-lab version dist.shasum
```

Use a new version for every later publication.
Create a matching Git tag after the public package passes a clean installation.
The CI workflow examines Node.js 22.12 and Node.js 24.

## Deploy the standalone demo

```sh
npm run build:demo
```

Deploy the contents of `demo-dist` to a static host.
The demo uses relative asset paths.
The demo does not need a backend, database, or server function.

## Integrate with the personal site

Install a fixed public package version in `me-landing`.

```sh
npm install --save-exact sperm-lab@0.3.0
```

Use the shared experiment page at `/sperm-lab/`.
Keep the package component and stylesheet as imports.
Keep the simulation source in this repository.

The Labs index uses a static preview from the headless model.
The Projects science tab uses the same text format as the other projects.
The homepage and top-bar structure remain consistent with the existing site.

Run the site build and release verifier before deployment.
Deploy only the generated public output through the site's Firebase Hosting command.
Examine the public lab, preview, package link, and source link after deployment.
