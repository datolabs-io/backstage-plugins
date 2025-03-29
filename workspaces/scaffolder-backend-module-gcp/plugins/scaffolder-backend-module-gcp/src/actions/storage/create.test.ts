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

import { getVoidLogger } from '@backstage/backend-common';
import { createGcpGcsBucketCreateAction } from './create';

jest.mock('@google-cloud/storage');

describe('createGcpGcsBucketCreateAction', () => {
  const mockCreateBucket = jest.fn();
  const mockStorage = {
    createBucket: mockCreateBucket,
  };

  beforeEach(() => {
    jest.resetAllMocks();
    const { Storage } = require('@google-cloud/storage');

    Storage.mockImplementation(() => mockStorage);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a simple GCS bucket with the given parameters', async () => {
    const action = createGcpGcsBucketCreateAction();
    const logger = getVoidLogger();
    jest.spyOn(logger, 'info');
    const input = {
      input: {
        project: 'test-project',
        bucketName: 'test-bucket',
        autoClass: false,
        location: undefined,
        storageClass: 'standard',
        versioning: undefined,
        hierarchicalNamespace: undefined,
      },
      logger,
    };
    const context: any = input;

    await action.handler(context);

    expect(mockCreateBucket).toHaveBeenCalledWith('test-bucket', {
      projectId: 'test-project',
      autoclass: { enabled: false },
      location: undefined,
      storageClass: 'standard',
      versioning: { enabled: false },
      hierarchicalNamespace: { enabled: false },
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Bucket test-bucket successfully created',
    );
  });

  it('should create a GCS bucket in us-east4 with autoclass enabled', async () => {
    const action = createGcpGcsBucketCreateAction();
    const logger = getVoidLogger();
    jest.spyOn(logger, 'info');
    const input = {
      input: {
        project: 'test-project',
        bucketName: 'test-bucket-us-east4',
        autoClass: true,
        location: 'us-east4',
        storageClass: 'standard',
        versioning: undefined,
        hierarchicalNamespace: undefined,
      },
      logger,
    };
    const context: any = input;

    await action.handler(context);

    expect(mockCreateBucket).toHaveBeenCalledWith('test-bucket-us-east4', {
      projectId: 'test-project',
      autoclass: { enabled: true },
      location: 'us-east4',
      storageClass: 'standard',
      versioning: { enabled: false },
      hierarchicalNamespace: { enabled: false },
    });
    expect(logger.info).toHaveBeenCalledWith(
      'Bucket test-bucket-us-east4 successfully created',
    );
  });
});
