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
import {
  createTemplateAction,
  TemplateAction,
} from '@backstage/plugin-scaffolder-node';
// import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { ProjectsClient } from '@google-cloud/resource-manager';

export function createGcpProjectCreateAction(): TemplateAction<{
  displayName: string;
  parent: string;
  labels?: Record<string, string>;
  tags?: Record<string, string>;
  projectId: string;
}> {
  return createTemplateAction({
    id: 'datolabs:gcp:project:create',
    description: 'Creates a new Project in GCP ',
    schema: {
      input: {
        required: ['projectId', 'parent'],
        type: 'object',
        properties: {
          displayName: {
            title: 'Display Name',
            description: 'The name of the project to be created',
            type: 'string',
          },
          parent: {
            title: 'Parent',
            description:
              'A reference to a parent Resource. eg., organizations/123 or folders/876.',
            type: 'string',
          },
          labels: {
            title: 'Labels',
            description: 'GCP labels to be added to the project',
            type: 'object',
            required: false,
            additionalProperties: {
              type: 'string',
            },
          },
          tags: {
            title: 'Tags',
            description: 'GCP tags to be added to the project. Immutable.',
            type: 'object',
            required: false,
            additionalProperties: {
              type: 'string',
            },
          },
          projectId: {
            title: 'Project ID',
            description: 'The GCP project ID',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const resourcemanagerClient = new ProjectsClient();
      const { displayName, parent, labels, projectId, tags } = ctx.input;

      try {
        const request = {
          project: {
            displayName: displayName,
            parent: parent,
            projectId: projectId,
            labels: labels,
            tags: tags,
          },
        };
        await resourcemanagerClient.createProject(request);
        ctx.logger.info(`Project successfully created`);
      } catch (e) {
        ctx.logger.error('Error creating project:', e);
        throw e;
      }
    },
  });
}
