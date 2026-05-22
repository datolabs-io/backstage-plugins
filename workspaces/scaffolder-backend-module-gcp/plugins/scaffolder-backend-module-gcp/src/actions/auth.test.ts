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
  buildGoogleClientOptions,
  describeGoogleAccessToken,
  resolveGoogleAccessToken,
} from './auth';

describe('resolveGoogleAccessToken', () => {
  it('returns source=none when nothing is provided', () => {
    expect(resolveGoogleAccessToken(undefined)).toEqual({ source: 'none' });
    expect(resolveGoogleAccessToken({})).toEqual({ source: 'none' });
  });

  it('reads secrets.googleAccessToken', () => {
    expect(
      resolveGoogleAccessToken({ googleAccessToken: 'from-secret' }),
    ).toEqual({ token: 'from-secret', source: 'secret' });
  });
});

describe('buildGoogleClientOptions', () => {
  it('returns empty options when neither token nor projectId is supplied', () => {
    expect(buildGoogleClientOptions()).toEqual({});
    expect(buildGoogleClientOptions(undefined)).toEqual({});
  });

  it('returns an OAuth2 client populated with the token', () => {
    const opts = buildGoogleClientOptions('abc123');
    expect(opts.authClient).toBeDefined();
    expect(opts.authClient!.credentials.access_token).toBe('abc123');
  });

  it('includes projectId when supplied, so the client does not auto-detect one', () => {
    expect(buildGoogleClientOptions(undefined, 'my-proj')).toEqual({
      projectId: 'my-proj',
    });
    const opts = buildGoogleClientOptions('abc123', 'my-proj');
    expect(opts.projectId).toBe('my-proj');
    expect(opts.authClient).toBeDefined();
  });
});

describe('describeGoogleAccessToken', () => {
  it('describes a secret-sourced token without leaking the value', () => {
    const msg = describeGoogleAccessToken({
      token: 'super-secret',
      source: 'secret',
    });
    expect(msg).toContain('secrets.googleAccessToken');
    expect(msg).toContain('length=12');
    expect(msg).not.toContain('super-secret');
  });

  it('describes the ADC fallback when no token is present', () => {
    expect(describeGoogleAccessToken({ source: 'none' })).toMatch(
      /Application Default Credentials/,
    );
  });
});
