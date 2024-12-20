/*
 * Copyright 2024 Datolabs, MB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export function createGcpSecretsManagerCreateAction() {
  return createTemplateAction<{
    name: string;
    value: string;
    labels?: Record<string, string>;
    project: string;
  }>({
    id: 'datolabs:gcp:secrets-manager:create',
    description: 'Creates a new secret in GCP Secret Manager',
    schema: {
      input: {
        required: ['name', 'project', 'value'],
        type: 'object',
        properties: {
          name: {
            title: 'Secret name',
            description: 'The name of the secret to be created',
            type: 'string',
          },
          value: {
            title: 'Secret value',
            description: 'The string value to be encrypted in the new secret',
            type: 'string',
          },
          labels: {
            title: 'Labels',
            description: 'GCP labels to be added to the secret',
            type: 'object',
            required: false,
            additionalProperties: {
              type: 'string',
            },
          },
          project: {
            title: 'GCP Project',
            description: 'The GCP project ID where the secret will be created',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const client = new SecretManagerServiceClient();
      const { name, value, labels, project } = ctx.input;

      try {
        const [secret] = await client.createSecret({
          parent: `projects/${project}`,
          secretId: name,
          secret: {
            labels,
            replication: {
              automatic: {},
            },
          },
        });

        const [version] = await client.addSecretVersion({
          parent: secret.name,
          payload: {
            data: Buffer.from(value, 'utf8'),
          },
        });

        ctx.logger.info(`Secret successfully created: ${secret.name}, version: ${version.name}`);
      } catch (e) {
        ctx.logger.error('Error creating secret:', e);
        throw e;
      }
    },
  });
}
