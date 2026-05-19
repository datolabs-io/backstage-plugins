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
import { UserRefreshClient } from 'google-auth-library';

export type GoogleAccessTokenSource = 'input' | 'secret' | 'none';

export interface ResolvedGoogleAccessToken {
  token?: string;
  source: GoogleAccessTokenSource;
}

/**
 * Resolve a Google OAuth2 access token from the available scaffolder
 * action context. Lookup order:
 *   1. An explicit `token` value (e.g. from action input).
 *   2. `ctx.secrets.googleAccessToken` (recommended way to forward the
 *      end user's Google OAuth token from the Scaffolder UI).
 *
 * Returns `{ source: 'none' }` when no token is available, which signals
 * callers to fall back to Application Default Credentials (ADC).
 */
export function resolveGoogleAccessToken(
  secrets: Record<string, string> | undefined,
  explicitToken?: string,
): ResolvedGoogleAccessToken {
  if (explicitToken) {
    return { token: explicitToken, source: 'input' };
  }
  if (secrets?.googleAccessToken) {
    return { token: secrets.googleAccessToken, source: 'secret' };
  }
  return { source: 'none' };
}

/**
 * Build options for a Google Cloud client library that will authenticate
 * as the supplied user access token. When no token is provided, returns
 * an empty object so the client falls back to Application Default
 * Credentials.
 *
 * Uses `UserRefreshClient` (a subclass of `OAuth2Client`) so the
 * resulting auth client is compatible with all three GCP client
 * families used by this plugin:
 *   - REST-based `@google-cloud/storage`
 *   - gRPC/gax-based `@google-cloud/secret-manager`
 *   - gRPC/gax-based `@google-cloud/resource-manager`
 *
 * The return type for `authClient` is intentionally widened to `any`
 * because each of those packages bundles its *own* copy of
 * `google-auth-library` with subtly different `UserRefreshClient`
 * declarations (e.g. v10-rc adds `addUserProjectAndAuthHeaders`).
 * The objects are interchangeable at runtime — only the duplicated
 * TypeScript declarations conflict, so a single concrete type cannot
 * satisfy all three call sites simultaneously.
 */
export function buildGoogleClientOptions(token?: string): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authClient?: any;
} {
  if (!token) {
    return {};
  }
  const authClient = new UserRefreshClient();
  authClient.setCredentials({ access_token: token });
  return { authClient };
}

/**
 * Produce a human-readable, secret-safe description of a resolved token
 * for log output. Never logs the token value itself.
 */
export function describeGoogleAccessToken(
  resolved: ResolvedGoogleAccessToken,
): string {
  switch (resolved.source) {
    case 'input':
      return `using Google OAuth access token from action input (length=${
        resolved.token?.length ?? 0
      })`;
    case 'secret':
      return `using Google OAuth access token from secrets.googleAccessToken (length=${
        resolved.token?.length ?? 0
      })`;
    case 'none':
    default:
      return 'no Google OAuth access token provided; falling back to Application Default Credentials';
  }
}
