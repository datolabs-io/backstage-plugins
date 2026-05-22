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
