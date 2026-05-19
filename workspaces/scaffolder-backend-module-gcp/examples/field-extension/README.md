# Google Access Token field extension (example)

This directory contains an example custom Backstage Scaffolder
[field extension](https://backstage.io/docs/features/software-templates/writing-custom-field-extensions)
that obtains the signed-in user's Google OAuth access token in the
browser and forwards it to the Scaffolder task as a secret named
`googleAccessToken`.

The GCP scaffolder actions in
`@datolabs/plugin-scaffolder-backend-module-gcp` look for that secret
(see [the plugin README](../../plugins/scaffolder-backend-module-gcp/README.md#authentication))
and use it to authenticate to GCP as the end user — so you don't need a
service account.

> The file is intentionally provided as copy/paste example code, not as
> a published npm package, because field extensions live in your
> Backstage app (`packages/app`).

## Prerequisites

1. The [Backstage Google auth provider](https://backstage.io/docs/auth/google/provider/)
   is configured and your users sign in with Google.
2. The frontend `googleAuthApiRef` is wired up (it ships in
   `@backstage/core-plugin-api`).
3. `@backstage/plugin-scaffolder-react` is installed in your app
   (it is, by default).

## Installation

1. Copy [`GoogleAccessTokenFieldExtension.tsx`](./GoogleAccessTokenFieldExtension.tsx)
   into your Backstage app, e.g.
   `packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/GoogleAccessTokenFieldExtension.tsx`.
2. Export the extension from an `index.ts` file in the same directory:

   ```tsx
   export { GoogleAccessTokenFieldExtension } from './GoogleAccessTokenFieldExtension';
   ```
2. Register the extension with Scaffolder in `/packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/extensions.ts`:

   ```tsx
  import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
  import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
  import { GoogleAccessTokenField } from './GoogleAccessTokenFieldExtension';

  /**
  * Register the field extension with the Scaffolder plugin.
  * Referenced from a template via `ui:field: GoogleAccessToken`.
  */
  export const GoogleAccessTokenFieldExtension = scaffolderPlugin.provide(
      createScaffolderFieldExtension({
          name: 'GoogleAccessToken',
          component: GoogleAccessTokenField,
      }),
  );

   ```
2. Register the extension with the Scaffolder route in
   `packages/app/src/App.tsx`:

   ```tsx
   import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
   import { GoogleAccessTokenFieldExtension } from './scaffolder/GoogleAccessTokenFieldExtension';

   // ...

    <ScaffolderFieldExtensions>
        <SelectFieldFromApiExtension />
        <GithubTeamPickerExtension />
        <GoogleAccessTokenFieldExtension />
    </ScaffolderFieldExtensions>
   ```

## Using the field in a template

Add a hidden parameter that uses the field. The field component renders
nothing visible; it just populates `secrets.googleAccessToken` when the
form loads.

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: create-gcp-gcs-bucket
  title: Create a GCP GCS Bucket
  description: Creates a new GCS Bucket.
  tags:
    - gcp
    - example
spec:
  type: template
  parameters:
    - title: Bucket Details
      required:
        - project
        - bucketName
      properties:
        googleToken:
          type: string
          ui:field: GoogleAccessToken
          ui:widget: hidden
          ui:options:
            # Optional — defaults shown.
            scopes:
              - https://www.googleapis.com/auth/cloud-platform
            secretKey: googleAccessToken
          # Hide the token from the user in the review step, since it's not relevant to them and looks scary. The field is already marked as a secret, so it won't be included in logs or API responses.
          ui:backstage:
            review:
              show: false

        bucketName:
          title: Name of GCS Bucket to create. Must be globally unique.
          type: string
          description: Bucket Name
        project:
          title: Project ID
          type: string
          description: Project ID
        autoclass:
          title: Auto Class
          type: boolean
          properties:
            enabled:
              type: boolean
              title: Enable Auto Class
              description: Enable Auto Class
              default: true
          default: true
        location:
          title: Location
          type: string
          description: Location
          default: us-central1

  steps:
    - id: create-bucket
      name: Create GCP Bucket
      action: datolabs:gcp:bucket:create
      input:
        bucketName: ${{ parameters.bucketName }}
        project: ${{ parameters.project }}
        autoClass: ${{ parameters.autoclass }}
        location: ${{ parameters.location }}
        token: ${{ parameters.googleToken }}

  output:
    links:
      - title: View the Bucket in GCP Console
        url: https://console.cloud.google.com/storage/browser?project=${{ parameters.project }}
```

## Notes & caveats

- **Scopes.** Request the least-privilege scopes you need. The example
  defaults to `https://www.googleapis.com/auth/cloud-platform`, which
  grants access to all Google Cloud APIs the user already has IAM
  rights to. You can narrow this with `ui:options.scopes`.
- **Token lifetime.** Google access tokens are short-lived (~1 hour).
  The token is captured when the form loads, so very long-running
  scaffolder tasks could outlive it. For most template runs this is
  fine.
- **Permissions.** The user must have the relevant GCP IAM roles
  (e.g. `roles/secretmanager.admin`, `roles/storage.admin`,
  `roles/resourcemanager.projectCreator`) on the target project /
  parent. Otherwise the action fails with a permission error.
- **Fallback.** If you do not register this extension (or the user
  isn't signed in with Google), the GCP actions fall back to
  Application Default Credentials on the backend.
