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
 *
 * --------------------------------------------------------------------------
 * Example custom Scaffolder field extension that fetches the signed-in
 * user's Google OAuth access token and forwards it to the Scaffolder
 * task as `secrets.googleAccessToken`. The GCP scaffolder actions in
 * `@datolabs/plugin-scaffolder-backend-module-gcp` will then authenticate
 * to GCP as the end user instead of using a service account.
 *
 * This file is intentionally provided as a copy/paste example rather
 * than a published package. Drop it into your Backstage app (typically
 * `packages/app/src/scaffolder/GoogleAccessTokenFieldExtension/`) and register it as shown below.
 * --------------------------------------------------------------------------
 */
import React, { useEffect } from 'react';
import { useApi, googleAuthApiRef } from '@backstage/core-plugin-api';
import { useTemplateSecrets } from '@backstage/plugin-scaffolder-react';
import type { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';

/**
 * Scopes requested for the user's Google access token. Adjust to the
 * least-privilege set required by the GCP actions you invoke. The
 * `cloud-platform` scope grants access to all Google Cloud APIs.
 */
const DEFAULT_SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

export type GoogleAccessTokenFieldUiOptions = {
    /** Override the requested OAuth scopes. */
    scopes?: string[];
    /** Override the secret key the token is stored under. Defaults to `googleAccessToken`. */
    secretKey?: string;
};

/**
 * Field component. Renders nothing — silently acquires the signed-in
 * user's Google OAuth access token and stores it in Scaffolder task
 * secrets so backend GCP actions can use it.
 *
 * Requires `additionalScopes` to include the requested scopes in the
 * Google auth provider config so the session refresh token covers them.
 */
export const GoogleAccessTokenField = (
    props: FieldExtensionComponentProps<
        string,
        GoogleAccessTokenFieldUiOptions
    >,
) => {
    const { onChange, uiSchema } = props;
    const googleAuth = useApi(googleAuthApiRef);
    const { setSecrets } = useTemplateSecrets();

    const scopes = uiSchema?.['ui:options']?.scopes ?? DEFAULT_SCOPES;
    const secretKey =
        uiSchema?.['ui:options']?.secretKey ?? 'googleAccessToken';

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const token = await googleAuth.getAccessToken(scopes);
                if (cancelled) return;
                setSecrets({ [secretKey]: token });
                onChange(token);
            } catch (e) {
                if (!cancelled) {
                    // eslint-disable-next-line no-console
                    console.error(
                        '[GoogleAccessTokenField] failed to acquire token:',
                        e,
                    );
                }
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};
