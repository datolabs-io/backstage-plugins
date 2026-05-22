# @datolabs/plugin-scaffolder-backend-module-gcp

This plugin extends the Backstage Scaffolder Backend with actions for interacting with Google Cloud Platform (GCP) services.

## Features

Currently supported actions:

- `datolabs:gcp:secrets-manager:create` — create secrets in GCP Secret Manager.
- `datolabs:gcp:project:create` — create a new GCP project under a folder or organization.
- `datolabs:gcp:bucket:create` — create a new GCS bucket.

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

This plugin supports two authentication modes:

1. **End-user OAuth token (recommended)** — the action authenticates as the
   Backstage user that triggered the template. GCP API calls are then
   subject to that user's IAM permissions, removing the need for a
   long-lived service account.
2. **Application Default Credentials (ADC)** — used as a fallback when no
   user token is provided.

#### Using the end-user's Google OAuth token

Each action reads the user's Google OAuth access token from
`ctx.secrets.googleAccessToken`. Secrets stay in memory for the task
run and are not persisted to the scaffolder database, so the token is
never written to durable storage.

A typical setup:

1. Configure the [Google auth provider](https://backstage.io/docs/auth/google/provider/)
   in your Backstage backend so users can sign in with Google.
2. In the Oauth app that you set up in GCP for the auth provider, make sure to add the necessary
   scopes for the actions you want to use (e.g. `https://www.googleapis.com/auth/cloud-platform`).
3. Update your app-config.yaml file to include additional scopes in the auth provider configuration:

```yaml
providers:
  google:
    development:
      clientId:
        $file: ./secrets/auth-google-client-id
      clientSecret:
        $file: ./secrets/auth-google-client-secret
      additionalScopes:
        - https://www.googleapis.com/auth/cloud-platform
```

4. In the frontend, request a Google access token with the scopes the
   action needs (e.g. `https://www.googleapis.com/auth/cloud-platform`)
   using `googleAuthApiRef.getAccessToken(...)` and forward it to the
   scaffolder task as a secret named `googleAccessToken`. This is
   typically done with a custom scaffolder field extension — a working
   copy/paste example is available in
   [`examples/field-extension`](../../examples/field-extension).
5. The action will then authenticate to GCP as the signed-in user.

Make sure the user has the necessary IAM roles for the action being
invoked.

#### Application Default Credentials (fallback)

When no user token is supplied, the plugin falls back to ADC. Credentials
are searched in this order:

1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
2. User credentials set up by using the Google Cloud CLI.
3. The attached service account (when running on GCP).

##### Local Development

For local development, you have two options:

1. Using a Service Account key file:

   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

2. Using gcloud CLI:

   ```bash
   gcloud auth application-default login
   ```

##### Production Environment

For production deployments on GCP (Cloud Run, GKE, etc.), we recommend
using the default compute service account or attaching a custom service
account to your workload. This is more secure than using service account
keys.

Make sure the principal (user or service account) has the necessary IAM
roles for the actions you plan to use:

- For Secret Manager: `roles/secretmanager.admin` or more granular permissions
- For Create projects: `roles/resourcemanager.projectCreator` or more [granular permissions](https://cloud.google.com/resource-manager/docs/creating-managing-projects#creating_a_project)
- For Create GCS Buckets: `roles/storage.admin` or more [granular permissions](https://cloud.google.com/storage/docs/access-control/iam-roles)

#### Verifying which credential the action used

Each action logs which credential source it ended up using when it runs.
Look for one of these lines in the Scaffolder task log:

- `using Google OAuth access token from secrets.googleAccessToken (length=…)`
- `no Google OAuth access token provided; falling back to Application Default Credentials`

The token value itself is never logged.

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
