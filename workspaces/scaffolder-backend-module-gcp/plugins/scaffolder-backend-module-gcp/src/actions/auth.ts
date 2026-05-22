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

export type GoogleAccessTokenSource = 'secret' | 'none';

export interface ResolvedGoogleAccessToken {
  token?: string;
  source: GoogleAccessTokenSource;
}

/**
 * Resolve a Google OAuth2 access token from the scaffolder action
 * context. Reads `ctx.secrets.googleAccessToken` — the secrets channel
 * is the only safe path, since scaffolder secrets stay in memory and
 * are not persisted to the task database (unlike action inputs).
 *
 * Returns `{ source: 'none' }` when no token is available, which signals
 * callers to fall back to Application Default Credentials (ADC).
 */
export function resolveGoogleAccessToken(
  secrets: Record<string, string> | undefined,
): ResolvedGoogleAccessToken {
  if (secrets?.googleAccessToken) {
    return { token: secrets.googleAccessToken, source: 'secret' };
  }
  return { source: 'none' };
}

/**
 * Build options for a Google Cloud client library that will authenticate
 * as the supplied user access token. When no token is provided, the
 * client falls back to Application Default Credentials.
 *
 * `projectId` should be passed whenever the caller already knows the
 * target project. With a user OAuth token the auth client has no
 * associated project, so GCP client libraries fail to auto-detect one
 * (see `findAndCacheProjectId` in `google-auth-library`). Passing it
 * explicitly avoids the lookup and the "Unable to detect a Project Id"
 * error.
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
export function buildGoogleClientOptions(
  token?: string,
  projectId?: string,
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authClient?: any;
  projectId?: string;
} {
  const opts: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authClient?: any;
    projectId?: string;
  } = {};
  if (projectId) {
    opts.projectId = projectId;
  }
  if (token) {
    const authClient = new UserRefreshClient();
    authClient.setCredentials({ access_token: token });
    // The hoisted `google-auth-library` (v9) returns a plain object from
    // `getRequestHeaders()`. The copy bundled with
    // `@google-cloud/resource-manager` (v10-rc) iterates that result via
    // `headers.forEach(value, key)`, which fails on a plain object with
    // "headers.forEach is not a function". We can't just convert the
    // result to a `Headers` instance — the REST-based storage client
    // still uses the v9 contract and reads headers via
    // `Object.entries(...)`, which would yield nothing from a `Headers`.
    // Instead, attach a non-enumerable `forEach` to the plain object so
    // both consumers work.
    const original = authClient.getRequestHeaders.bind(authClient);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (authClient as any).getRequestHeaders = async (...args: any[]) => {
      const result = await original(...(args as []));
      if (
        result &&
        typeof (result as { forEach?: unknown }).forEach === 'function'
      ) {
        return result;
      }
      const headers = result as Record<string, unknown>;
      Object.defineProperty(headers, 'forEach', {
        value: (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cb: (value: unknown, key: string, parent: any) => void,
          thisArg?: unknown,
        ) => {
          for (const key of Object.keys(headers)) {
            cb.call(thisArg, headers[key], key, headers);
          }
        },
        enumerable: false,
        configurable: true,
        writable: true,
      });
      return result;
    };
    opts.authClient = authClient;
  }
  return opts;
}

/**
 * Produce a human-readable, secret-safe description of a resolved token
 * for log output. Never logs the token value itself.
 */
export function describeGoogleAccessToken(
  resolved: ResolvedGoogleAccessToken,
): string {
  switch (resolved.source) {
    case 'secret':
      return `using Google OAuth access token from secrets.googleAccessToken (length=${
        resolved.token?.length ?? 0
      })`;
    case 'none':
    default:
      return 'no Google OAuth access token provided; falling back to Application Default Credentials';
  }
}
