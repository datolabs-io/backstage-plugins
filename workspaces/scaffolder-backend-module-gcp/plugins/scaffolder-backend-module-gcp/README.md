# @datolabs/plugin-scaffolder-backend-module-gcp

This plugin extends the Backstage Scaffolder Backend with actions for interacting with Google Cloud Platform (GCP) services.

## Features

Currently supported actions:

- `datolabs:gcp:secrets-manager:create` - Create secrets in GCP Secret Manager.

## Installation

```bash
# From your Backstage root directory
yarn add --cwd packages/backend @datolabs/plugin-scaffolder-backend-module-gcp
```

Update `/packages/backend/src/index.ts` to enable the plugin:

```typescript
backend.add(import('@datolabs/plugin-scaffolder-backend-module-gcp'));
```

### Authentication

This plugin uses Application Default Credentials (ADC) for authentication with GCP services. ADC provides a strategy to automatically find credentials based on the application environment.

The authentication library searches for credentials in the following order:

1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
2. User credentials set up by using the Google Cloud CLI.
3. The attached service account (when running on GCP).

#### Local Development

For local development, you have two options:

1. Using a Service Account key file:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

2. Using gcloud CLI:

   ```bash
   gcloud auth application-default login
   ```

#### Production Environment

For production deployments on GCP (Cloud Run, GKE, etc.), we recommend using the default compute service account or attaching a custom service account to your workload. This is more secure than using service account keys.

Make sure the service account has the necessary IAM roles for the actions you plan to use:

- For Secret Manager: `roles/secretmanager.admin` or more granular permissions
- For Create projects: `roles/resourcemanager.projectCreator` or more [granular permissions](https://cloud.google.com/resource-manager/docs/creating-managing-projects#creating_a_project)
- For Create GCS Buckets: `roles/storage.admin` or more [granular permissions](https://cloud.google.com/storage/docs/access-control/iam-roles)
- For Create GCS Bucket IAM Policy: `roles/storage.admin` or more [granular permissions](https://cloud.google.com/storage/docs/access-control/iam-roles)

## Usage Examples

### Creating a Secret in Secret Manager

Here's an example scaffolding template step that creates a secret in GCP Secret Manager:

```yaml
# ...
steps:
  - id: create-secret
    name: Create GCP Secret
    action: datolabs:gcp:secrets-manager:create
    input:
      name: ${{ parameters.name }}
      value: ${{ secrets.value }}
      project: ${{ parameters.project }}
```

Please make sure to add `ui:field: Secret` to the secret value parameter in the template to ensure it is treated as sensitive.

### Creating a Project

```yaml
steps:
  - id: create-project
    name: Create GCP Project
    action: datolabs:gcp:project:create
    input:
      displayName: ${{ parameters.displayName }}
      parent: ${{ parameters.parent }}
      projectId: ${{ parameters.projectId }}
```

### Creating a GCS Bucket

```yaml
steps:
  - id: create-bucket
    name: Create GCP Bucket
    action: datolabs:gcp:bucket:create
    input:
      bucketName: ${{ parameters.bucketName }}
      project: ${{ parameters.project }}
      autoClass: ${{ parameters.autoclass }}
      location: ${{ parameters.location }}
```

Full template examples can be found in the [examples](../../examples) directory.
