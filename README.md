# wait-for-docker-image-action [![e2e](https://github.com/int128/wait-for-docker-image-action/actions/workflows/e2e.yaml/badge.svg)](https://github.com/int128/wait-for-docker-image-action/actions/workflows/e2e.yaml)

This is an action to ensure a Docker image of the current Git revision is available.
It is useful for an end-to-end test with built image.

## Getting Started

This action is designed for [OCI annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys).
It waits until `org.opencontainers.image.revision` annotation is the current Git revision.
You can generate the annotations using [docker/metadata-action](https://github.com/docker/metadata-action).

Here is an example workflow.

```yaml
name: e2e-test

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
      - uses: docker/metadata-action@v4
        id: metadata
        with:
          images: ghcr.io/${{ github.repository }}
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v3
        id: build
        with:
          push: true
          tags: ${{ steps.metadata.outputs.tags }}
          labels: ${{ steps.metadata.outputs.labels }}

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3

      # Prepare a test environment,
      # for example, create a Kubernetes cluster or set up middlewares
      - run: make -C e2e-test setup

      # Wait for the image
      - uses: docker/metadata-action@v4
        id: metadata
        with:
          images: ghcr.io/${{ github.repository }}
      - uses: int128/wait-for-docker-image-action@v1
        with:
          tags: ${{ steps.metadata.outputs.tags }}

      # Write your test here
      - run: make -C e2e-test test
```

## Specification

### Inputs

| Name                | Default      | Description                    |
| ------------------- | ------------ | ------------------------------ |
| `tags`              | (required)   | Docker image tags              |
| `expected-revision` | `github.sha` | Expected Git revision of image |
| `timeout-seconds`   | 300          | Timeout                        |
| `polling-seconds`   | 3            | Polling interval               |
