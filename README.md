# Datolabs Backstage Plugins Repository

## What is this repository?

This repository hosts plugins developed by Datolabs. The processes, tooling, and workflows are based on those in [backstage/community-plugins](https://github.com/backstage/community-plugins).

Plugins in this repository will be published to the `@datolabs` public npm namespace.

## Contributing a plugin

Contributions are welcome! To contribute a plugin, please follow the guidelines outlined in [CONTRIBUTING.md](./CONTRIBUTING.md). You can choose to either contribute to the shared repository or self-host your plugin for full autonomy.

## Plugins Workflow

The `datolabs-backstage-plugins` repository is organized into multiple workspaces, with each workspace containing a plugin or a set of related plugins. Each workspace operates independently, with its own release cycle and dependencies managed via npm. When a new changeset is added (each workspace has its own `.changesets` directory), a `Version packages ($workspace_name)` PR is automatically generated. Merging this PR triggers the release of all plugins in the workspace and updates the corresponding `CHANGELOG` files.

## Available Plugins

### [scaffolder-backend-module-gcp](./workspaces/scaffolder-backend-module-gcp)

Scaffolder Backend Module to interact with Google Cloud Platform (GCP), e.g. to create secrets in GCP Secret Manager.
