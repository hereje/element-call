/*
Copyright 2021-2023 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { FC, useEffect, useState, useCallback } from "react";
import { MatrixRTCSession } from "matrix-js-sdk/src/matrixrtc/MatrixRTCSession";

import { useClientLegacy } from "../ClientContext";
import { ErrorView, LoadingView } from "../FullScreenView";
import { RoomAuthView } from "./RoomAuthView";
import { GroupCallLoader } from "./GroupCallLoader";
import { GroupCallView } from "./GroupCallView";
import { useUrlParams } from "../UrlParams";
import { useRegisterPasswordlessUser } from "../auth/useRegisterPasswordlessUser";
import { useOptInAnalytics } from "../settings/useSetting";
import { HomePage } from "../home/HomePage";

export const RoomPage: FC = () => {
  const {
    roomAlias,
    roomId,
    viaServers,
    isEmbedded,
    preload,
    hideHeader,
    displayName,
  } = useUrlParams();
  const roomIdOrAlias = roomId ?? roomAlias;
  if (!roomIdOrAlias) {
    console.error("No room specified");
  }

  const [optInAnalytics, setOptInAnalytics] = useOptInAnalytics();
  const { registerPasswordlessUser } = useRegisterPasswordlessUser();
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // During the beta, opt into analytics by default
    if (optInAnalytics === null && setOptInAnalytics) setOptInAnalytics(true);
  }, [optInAnalytics, setOptInAnalytics]);

  const { loading, authenticated, client, error, passwordlessUser } =
    useClientLegacy();

  useEffect(() => {
    // If we've finished loading, are not already authed and we've been given a display name as
    // a URL param, automatically register a passwordless user
    if (!loading && !authenticated && displayName) {
      setIsRegistering(true);
      registerPasswordlessUser(displayName).finally(() => {
        setIsRegistering(false);
      });
    }
  }, [
    loading,
    authenticated,
    displayName,
    setIsRegistering,
    registerPasswordlessUser,
  ]);

  const groupCallView = useCallback(
    (rtcSession: MatrixRTCSession) => (
      <GroupCallView
        client={client!}
        rtcSession={rtcSession}
        isPasswordlessUser={passwordlessUser}
        isEmbedded={isEmbedded}
        preload={preload}
        hideHeader={hideHeader}
      />
    ),
    [client, passwordlessUser, isEmbedded, preload, hideHeader]
  );

  if (loading || isRegistering) {
    return <LoadingView />;
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  if (!client) {
    return <RoomAuthView />;
  }

  if (!roomIdOrAlias) {
    return <HomePage />;
  }

  return (
    <GroupCallLoader
      client={client}
      roomIdOrAlias={roomIdOrAlias}
      viaServers={viaServers}
    >
      {groupCallView}
    </GroupCallLoader>
  );
};
