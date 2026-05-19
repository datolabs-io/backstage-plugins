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

  it('prefers the explicit token over the secret', () => {
    expect(
      resolveGoogleAccessToken(
        { googleAccessToken: 'from-secret' },
        'explicit',
      ),
    ).toEqual({ token: 'explicit', source: 'input' });
  });

  it('falls back to secrets.googleAccessToken', () => {
    expect(
      resolveGoogleAccessToken({ googleAccessToken: 'from-secret' }),
    ).toEqual({ token: 'from-secret', source: 'secret' });
  });
});

describe('buildGoogleClientOptions', () => {
  it('returns empty options when no token is supplied', () => {
    expect(buildGoogleClientOptions()).toEqual({});
    expect(buildGoogleClientOptions(undefined)).toEqual({});
  });

  it('returns an OAuth2 client populated with the token', () => {
    const opts = buildGoogleClientOptions('abc123');
    expect(opts.authClient).toBeDefined();
    expect(opts.authClient!.credentials.access_token).toBe('abc123');
  });
});

describe('describeGoogleAccessToken', () => {
  it('describes an input-sourced token without leaking the value', () => {
    const msg = describeGoogleAccessToken({
      token: 'super-secret',
      source: 'input',
    });
    expect(msg).toContain('action input');
    expect(msg).toContain('length=12');
    expect(msg).not.toContain('super-secret');
  });

  it('describes a secret-sourced token', () => {
    const msg = describeGoogleAccessToken({
      token: 'tok',
      source: 'secret',
    });
    expect(msg).toContain('secrets.googleAccessToken');
    expect(msg).toContain('length=3');
  });

  it('describes the ADC fallback when no token is present', () => {
    expect(describeGoogleAccessToken({ source: 'none' })).toMatch(
      /Application Default Credentials/,
    );
  });
});
