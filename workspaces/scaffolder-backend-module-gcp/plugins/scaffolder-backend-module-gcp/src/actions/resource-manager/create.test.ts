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
import { createGcpProjectCreateAction } from './create';

jest.mock('@google-cloud/resource-manager');

describe('createGcpProjectCreateAction', () => {
  const mockProjectsClient = {
    createProject: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    const { ProjectsClient } = require('@google-cloud/resource-manager');

    ProjectsClient.mockImplementation(() => mockProjectsClient);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create a GCP project successfully', async () => {
    const action = createGcpProjectCreateAction();
    const logger = getVoidLogger();
    const mockInput = {
      input: {
        displayName: 'Test Project',
        parent: 'organizations/123',
        projectId: 'test-project-id',
        labels: { env: 'test' },
        tags: { tag1: 'value1' },
      },
      logger,
    };
    const mockContext: any = mockInput;

    mockProjectsClient.createProject.mockResolvedValue([
      { projectId: 'test-project-id' },
    ]);

    await action.handler(mockContext);

    expect(mockProjectsClient.createProject).toHaveBeenCalledWith({
      project: {
        displayName: 'Test Project',
        parent: 'organizations/123',
        projectId: 'test-project-id',
        labels: { env: 'test' },
        tags: { tag1: 'value1' },
      },
    });
  });

  it('should fail to create a GCP project with an error', async () => {
    const action = createGcpProjectCreateAction();
    const logger = getVoidLogger();
    const mockInput = {
      input: {
        displayName: 'Test Project',
        parent: 'organizations/123',
        projectId: 'test-project-id',
        labels: { env: 'test' },
        tags: { tag1: 'value1' },
      },
      logger,
    };
    const mockContext: any = mockInput;

    const errorMessage = 'Error creating project: test-project-id';
    mockProjectsClient.createProject.mockRejectedValue(new Error(errorMessage));

    await expect(action.handler(mockContext)).rejects.toThrow(errorMessage);

    expect(mockProjectsClient.createProject).toHaveBeenCalledWith({
      project: {
        displayName: 'Test Project',
        parent: 'organizations/123',
        projectId: 'test-project-id',
        labels: { env: 'test' },
        tags: { tag1: 'value1' },
      },
    });
  });
});
