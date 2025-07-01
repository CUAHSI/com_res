#!/bin/bash

docker run --rm -ti -u root \
  -v $(pwd)/data/:/home/data \
  -v $(pwd)/output/:/home/output \
  -v $(pwd)/generate_fim.py:/home/generate_fim.py \
  --entrypoint /bin/bash \
  us-central1-docker.pkg.dev/com-res/cuahsi/fimserv:latest
