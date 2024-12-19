# Contributing to `datolabs-io/backstage-plugins`

The `datolabs-io/backstage-plugins` repository is designed as a collaborative space to host and manage Backstage plugins developed by DatoLabs and the community. This repository provides plugin maintainers with tools for plugin management and publication. By contributing a plugin to this repository, maintainers agree to adhere to specific guidelines and a standardized release process detailed in this guide.

## Table of Contents

- [Contributing to datolabs-io/backstage-plugins](#Contributing to `datolabs-io/backstage-plugins`)
  - [License](#license)
  - [Get Started](#get-started)
    - [Forking the Repository](#forking-the-repository)
    - [Developing Plugins in Workspaces](#developing-plugins-in-workspaces)
  - [Coding Guidelines](#coding-guidelines)
  - [Versioning](#versioning)
  - [Creating Changesets](#creating-changesets)
  - [Release](#release)
  - [Creating a new Workspace](#creating-a-new-workspace)
  - [Creating new plugins or packages in a Workspace](#creating-new-plugins-or-packages-in-a-workspace)
  - [API Reports](#api-reports)
  - [Submitting a Pull Request](#submitting-a-pull-request)
    - [Merge Strategy](#merge-strategy)
  - [Review Process](#review-process)

## License

The plugins repository is under Apache 2.0 license. All plugins added & moved to the repository will be kept under the same license. If you are moving a plugin over make sure that no other license file is in the plugin workspace & all `package.json` files either have no version defined or explicitly use _"Apache 2.0"_.

## Get Started

### Forking the Repository

Fork the repository into your own GitHub account and clone that code to your local machine. If you cloned a fork, you can add the upstream dependency like so:

```bash
git remote add upstream git@github.com:datolabs-io/backstage-plugins.git
git pull upstream main
```

After you have cloned the repository, you should run the following commands once to set things up for development:

```bash
cd backstage-plugins
yarn install
```

### Developing Plugins in Workspaces

Most plugins come with a standalone runner that you can utilize to develop plugins in isolation. Navigate to a workspace and plugin folder and run `yarn start` to launch the development standalone server.

For a richer development environment, some workspaces may provide a full Backstage environment that you can run with `yarn dev` in the workspace root.

> **Important**: Development environments are configured on a per-workspace basis. Check the workspace `README.md` for specific setup instructions.

## Coding Guidelines

All code is formatted with `prettier` using the configuration in the repo. Configure your editor to format automatically, or use `yarn prettier --write <file>` to format files.

## Versioning

All packages follow semantic versioning enforced through Changesets. This ensures proper version management and changelog generation.

## Creating Changesets

To create a changeset:

1. Navigate to the workspace root directory for your plugin
2. Run `yarn changeset`
3. Select the packages and type of change
4. Enter a description of the change
5. Review the generated changeset file in `.changeset`
6. Commit the changeset file

## Release

Every PR with changes must include a changeset. Upon merging, a "Version Packages" PR will be created automatically. Merging this PR triggers the release process.

## Creating a new Workspace

Workspace names should reflect their contained plugins (e.g., 'todo' for todo & todo-backend plugins).

To create a workspace:

```bash
cd backstage-plugins
yarn install
yarn create-workspace
```

## Creating new plugins or packages in a Workspace

Once you have a workspace, create new plugins using:

```bash
cd workspaces/your-workspace
yarn new
```

## API Reports

We use API Extractor to generate API Reports in Markdown format. To update or generate reports:

```bash
# Update all API reports
yarn build:api-reports

# Update specific plugin
yarn build:api-reports plugins/<your-plugin>
```

## Submitting a Pull Request

When submitting a PR, please:

1. Include a clear description of changes
2. Add appropriate changesets
3. Update documentation as needed
4. Include tests for new functionality
5. Add screenshots for UI changes
6. Ensure all commits are signed-off

### Merge Strategy

The default merge strategy is **squash merge**. In cases where preserving commit history is important (like separate frontend/backend changes), **rebase merge** may be used with maintainer approval.

## Review Process

After submitting a PR:

1. Automated checks will run
2. Reviewers will be automatically assigned
3. Address any feedback from reviewers
4. Obtain required approvals
5. Maintainers will merge approved PRs

> **Note**: Keep your PR up to date by rebasing when needed. If you encounter `yarn.lock` conflicts, update your main branch and run `yarn install`.

This CONTRIBUTING.md combines elements from both examples while:

1. Customizing organization/repository names for DatoLabs
2. Simplifying some sections while maintaining key information
3. Adding clear structure with detailed but concise instructions
4. Including practical tips for common contribution scenarios
5. Maintaining focus on key workflows (changesets, API reports, PR process)

The main differences from the source files include:

- Removed organization-specific elements (like Red Hat's specific workflows)
- Simplified the migration process compared to the Backstage community version
- Focused on essential workflows while keeping instructions clear and actionable
- Added more direct guidance for common development tasks
- Streamlined the review process section

Would you like me to adjust any particular section or add more specific details for certain workflows?
