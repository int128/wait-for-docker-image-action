# wait-for-docker-image-action [![e2e](https://github.com/int128/wait-for-docker-image-action/actions/workflows/e2e.yaml/badge.svg)](https://github.com/int128/wait-for-docker-image-action/actions/workflows/e2e.yaml)

This is an action to ensure a Docker image is available at the current Git revision.
It is useful for an end-to-end test with docker build in GitHub Actions.

## Problem to solve

For building and testing a Docker image in GitHub Actions, typical workflow would be like:

1. Build job
2. Test job (after build)

However, if the test job takes a long time to prepare an environment, it would be nice to run build and prepare in parallel.
For example,

- Install packages using `apt-get install`
- Create a Kubernetes cluster using `kind`
- Deploy components using `kubectl`

The workflow can be run in parallel, like:

- Build job
- Test job
    1. Prepare an environment
    2. Wait for the image (this action provides this step)
    3. Run the test

This action waits until `org.opencontainers.image.revision` annotation of the Docker image is the current Git revision.
You can generate [OCI annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md#pre-defined-annotation-keys) using [docker/metadata-action](https://github.com/docker/metadata-action).

## Example

Here is an example workflow.
It builds an Docker image and tests it.

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
        env:
          TARGET_IMAGE: ${{ steps.metadata.outputs.tags }}
```

## Specification

This actions depends on `docker pull` and `docker image inspect` command.

### Inputs

| Name                | Default     | Description                            |
| ------------------- | ----------- | -------------------------------------- |
| `tags`              | (required)  | Docker image tags                      |
| `expected-revision` | (see below) | Expected Git revisions of Docker image |
| `timeout-seconds`   | 600         | Timeout                                |
| `polling-seconds`   | 5           | Polling interval                       |

By default, this action waits until the revision is `github.sha` or `github.event.pull_request.head.sha`.
Since [docker/metadata-action@v4.1.0](https://github.com/docker/metadata-action/releases/tag/v4.1.0),
it generates the head sha on pull request event (see also [the issue](https://github.com/docker/metadata-action/issues/206)).
