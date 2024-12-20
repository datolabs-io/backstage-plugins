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
import { PassThrough } from 'stream';
import { createGcpSecretsManagerCreateAction } from './create';

jest.mock('@google-cloud/secret-manager');

describe('datolabs:gcp:secrets-manager:create', () => {
  const mockCreateSecret = jest.fn();
  const mockAddSecretVersion = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    const {
      SecretManagerServiceClient,
    } = require('@google-cloud/secret-manager');
    SecretManagerServiceClient.mockImplementation(() => ({
      createSecret: mockCreateSecret,
      addSecretVersion: mockAddSecretVersion,
    }));
  });

  const action = createGcpSecretsManagerCreateAction();
  const mockContext = {
    workspacePath: '/fake-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
    checkpoint: jest.fn(),
    getInitiatorCredentials: jest.fn(),
  };

  it('should create a secret successfully', async () => {
    const input = {
      name: 'test-secret',
      value: 'secret-value',
      project: 'test-project',
      labels: {
        env: 'test',
      },
    };

    mockCreateSecret.mockResolvedValue([
      {
        name: 'projects/test-project/secrets/test-secret',
      },
    ]);

    mockAddSecretVersion.mockResolvedValue([
      {
        name: 'projects/test-project/secrets/test-secret/versions/1',
      },
    ]);

    await action.handler({
      ...mockContext,
      input,
    });

    expect(mockCreateSecret).toHaveBeenCalledWith({
      parent: 'projects/test-project',
      secretId: 'test-secret',
      secret: {
        labels: {
          env: 'test',
        },
        replication: {
          automatic: {},
        },
      },
    });

    expect(mockAddSecretVersion).toHaveBeenCalledWith({
      parent: 'projects/test-project/secrets/test-secret',
      payload: {
        data: Buffer.from('secret-value', 'utf8'),
      },
    });
  });

  it('should create a secret without labels', async () => {
    const input = {
      name: 'test-secret',
      value: 'secret-value',
      project: 'test-project',
    };

    mockCreateSecret.mockResolvedValue([
      {
        name: 'projects/test-project/secrets/test-secret',
      },
    ]);

    mockAddSecretVersion.mockResolvedValue([
      {
        name: 'projects/test-project/secrets/test-secret/versions/1',
      },
    ]);

    await action.handler({
      ...mockContext,
      input,
    });

    expect(mockCreateSecret).toHaveBeenCalledWith({
      parent: 'projects/test-project',
      secretId: 'test-secret',
      secret: {
        labels: undefined,
        replication: {
          automatic: {},
        },
      },
    });
  });

  it('should throw an error when secret creation fails', async () => {
    const input = {
      name: 'test-secret',
      value: 'secret-value',
      project: 'test-project',
    };

    const error = new Error('Secret creation failed');
    mockCreateSecret.mockRejectedValue(error);

    await expect(
      action.handler({
        ...mockContext,
        input,
      }),
    ).rejects.toThrow('Secret creation failed');
  });

  it('should throw an error when adding secret version fails', async () => {
    const input = {
      name: 'test-secret',
      value: 'secret-value',
      project: 'test-project',
    };

    mockCreateSecret.mockResolvedValue([
      {
        name: 'projects/test-project/secrets/test-secret',
      },
    ]);

    const error = new Error('Failed to add secret version');
    mockAddSecretVersion.mockRejectedValue(error);

    await expect(
      action.handler({
        ...mockContext,
        input,
      }),
    ).rejects.toThrow('Failed to add secret version');
  });
});
