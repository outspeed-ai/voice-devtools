# Quickstart

This package is used to establish a session with Outspeed (or Realtime API) via WebRTC for your voice agents.

## Server setup

We need a server that'll issue an ephemeral key. This key allows the client to establish a secure direction connection with the model provider
from the frontend. The ephemeral key is modeled after the same concept in [Realtime API spec](https://platform.openai.com/docs/guides/realtime#creating-an-ephemeral-token).


## Client Setup

Follow these steps to do it:
1. Define a `SessionConfig` object that will be used to make the connection
2. Choose a provider for that `SessionConfig`. Note that some models are only supported by some providers.
    Ex: Outspeed supports Orpheus-3b. So choose `providers.Outspeed` from `providers` object exported by the package
3. Create a `ConnectionConfig` object that will be used to make the connection. It'll use a `SessionConfig` and a chosen provider
Here's an example of a `ConnectionConfig`
4. Make the connection using `startWebrtcSession(ephemeralKey, connectionConfig)`