# gh-action-docker-state

GitHub Action to restore/save `/var/lib/docker` directory.

Only supported on linux platform with docker installed

## Usage
```
name: ci
on: push
jobs:
  list-images:
    runs-on: ubuntu-latest
    steps:
      - uses: win-t/gh-action-docker-state@v1
      - name: Inspect images
        run: |
          docker images
          docker pull nginx
          docker images
```

`docker pull nginx` only will pull from registry on the first run
