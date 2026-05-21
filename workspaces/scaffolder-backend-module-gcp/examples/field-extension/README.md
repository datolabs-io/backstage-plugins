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
3. `@backstage/plugin-scaffolder-react` and `@backstage/plugin-scaffolder`
   are installed in your app (they are, by default).

## Installation

The example is split into two files so the React component and the
Scaffolder plugin registration live separately, matching common
Backstage app conventions.

1. Copy [`GoogleAccessTokenFieldExtension.tsx`](./GoogleAccessTokenFieldExtension.tsx)
   into your Backstage app at
   `packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/GoogleAccessTokenFieldExtension.tsx`.
   This file exports the React component `GoogleAccessTokenField`.

2. Create `packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/extensions.ts`
   to register the component as a Scaffolder field extension:

   ```tsx
   import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
   import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
   import { GoogleAccessTokenField } from './GoogleAccessTokenFieldExtension';

   /**
    * Registers the field with the Scaffolder plugin so templates can
    * reference it via `ui:field: GoogleAccessToken`.
    */
   export const GoogleAccessTokenFieldExtension = scaffolderPlugin.provide(
     createScaffolderFieldExtension({
       name: 'GoogleAccessToken',
       component: GoogleAccessTokenField,
     }),
   );
   ```

3. Create `packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/index.ts`
   to re-export the registration for convenient importing:

   ```ts
   export { GoogleAccessTokenFieldExtension } from './extensions';
   ```

4. Register the extension inside the Scaffolder route in
   `packages/app/src/App.tsx`:

   ```tsx
   import { ScaffolderFieldExtensions } from '@backstage/plugin-scaffolder-react';
   import { GoogleAccessTokenFieldExtension } from './scaffolder/GoogleAccessTokenFieldExtension';

   // ...

   <Route path="/create" element={<ScaffolderPage />}>
     <ScaffolderFieldExtensions>
       {/* other field extensions you already have */}
       <GoogleAccessTokenFieldExtension />
     </ScaffolderFieldExtensions>
   </Route>;
   ```

## Using the field in a template

Add a hidden parameter that uses the field. The field renders nothing
visible — it populates `secrets.googleAccessToken` when the form loads
so the backend GCP action can pick it up automatically. The token is
written only to scaffolder secrets (which stay in memory) and never to
the form's `parameters`, so it is not persisted to the scaffolder
database.

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: create-gcp-gcs-bucket
  title: Create a GCP GCS Bucket
  description: Creates a new GCS Bucket as the signed-in user.
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
        # Hidden field — invokes the field extension to acquire the
        # user's Google OAuth access token and stash it in
        # `secrets.googleAccessToken` for the backend action. The
        # parameter value itself stays empty.
        googleToken:
          type: string
          ui:field: GoogleAccessToken
          ui:widget: hidden
          ui:options:
            # Optional — default shown.
            scopes:
              - https://www.googleapis.com/auth/cloud-platform

        bucketName:
          title: Bucket name (must be globally unique)
          type: string
        project:
          title: Project ID
          type: string
        autoclass:
          title: Auto Class
          type: boolean
          default: true
        location:
          title: Location
          type: string
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
        # No token input — the action reads `secrets.googleAccessToken`
        # directly.

  output:
    links:
      - title: View the Bucket in GCP Console
        url: https://console.cloud.google.com/storage/browser?project=${{ parameters.project }}
```

## How to verify it's working

Each GCP action logs which credential source it ended up using.
After running a template, look in the Scaffolder task log for one of:

- `using Google OAuth access token from secrets.googleAccessToken (length=…)`
  — the field extension is wired up and the user's token reached the
  action.
- `no Google OAuth access token provided; falling back to Application Default Credentials`
  — the action did not receive a token; it will use ADC on the backend.

The token value itself is never logged.

## Notes & caveats

- **Scopes.** Request the least-privilege scopes you need. The default
  `https://www.googleapis.com/auth/cloud-platform` grants access to all
  Google Cloud APIs the user already has IAM rights to. You can narrow
  this with `ui:options.scopes`.
- **Additional scopes in the auth provider config.** For
  `googleAuth.getAccessToken(scopes)` to return a usable token, those
  scopes must either have been granted during sign-in or be requestable
  by the user. In most setups Backstage's Google auth provider will
  prompt the user for consent on the first request.
- **Token lifetime.** Google access tokens are short-lived (~1 hour).
  The token is captured when the form loads, so very long-running
  scaffolder tasks could outlive it. For most template runs this is
  fine.
- **Permissions.** The user must have the relevant GCP IAM roles
  (e.g. `roles/secretmanager.admin`, `roles/storage.admin`,
  `roles/resourcemanager.projectCreator`) on the target project /
  parent. Otherwise the action fails with a permission error.
- **Error reporting.** The example component logs token-acquisition
  failures to the browser console (`[GoogleAccessTokenField] failed to
acquire token: …`) and renders nothing. If you want the user to see
  the error inline, render an error element from the component instead.
- **Fallback.** If you do not register this extension (or the user
  isn't signed in with Google), the GCP actions fall back to
  Application Default Credentials on the backend.
