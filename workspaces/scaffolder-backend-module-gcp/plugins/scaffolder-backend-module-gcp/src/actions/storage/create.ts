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
import { Storage } from '@google-cloud/storage';

export function createGcpGcsBucketCreateAction(): TemplateAction<{
  project: string;
  autoClass: boolean;
  bucketName: string;
  hierarchicalNamespace: boolean;
  location: string;
  storageClass: string;
  versioning: boolean;
}> {
  return createTemplateAction({
    id: 'datolabs:gcp:bucket:create',
    description: 'Creates a new GCS Bucket in GCP ',
    schema: {
      input: {
        required: ['project', 'bucketName'],
        type: 'object',
        properties: {
          project: {
            title: 'Project ID',
            description: 'The GCP project ID',
            type: 'string',
          },
          bucketName: {
            title: 'Bucket Name',
            description:
              'The name of the bucket to be created. Must be globally unique.',
            type: 'string',
          },
          autoClass: {
            title: 'Auto Class',
            description: 'Enable auto class.',
            type: 'boolean',
            required: false,
            default: false,
          },
          location: {
            title: 'Location',
            description:
              'The location of the bucket. https://cloud.google.com/storage/docs/locations',
            type: 'string',
            required: false,
          },
          storageClass: {
            title: 'Storage Class',
            description:
              'The storage class of the bucket. https://cloud.google.com/storage/docs/storage-classes. Must be: "standard, nearline, coldline, or archive"',
            type: 'string',
            default: 'standard',
            required: false,
          },
          versioning: {
            title: 'Versioning',
            description: 'Enable versioning.',
            type: 'boolean',
            required: false,
            default: false,
          },
          hierarchicalNamespace: {
            title: 'Hierarchical Namespace',
            description: 'Enable hierarchical namespace.',
            type: 'boolean',
            required: false,
            default: false,
          },
        },
      },
    },
    async handler(ctx) {
      const storageClient = new Storage();
      const {
        autoClass = false,
        bucketName,
        hierarchicalNamespace = false,
        location,
        project,
        storageClass = 'standard',
        versioning = false,
      } = ctx.input;

      try {
        const request = {
          projectId: project,
          storageClass: storageClass,
          location: location,
          autoclass: { enabled: autoClass },
          versioning: { enabled: versioning },
          hierarchicalNamespace: { enabled: hierarchicalNamespace },
        };
        await storageClient.createBucket(bucketName, request);
        ctx.logger.info(`Bucket ${bucketName} successfully created`);
      } catch (e) {
        ctx.logger.error('Error creating Bucket:', e);
        throw e;
      }
    },
  });
}
