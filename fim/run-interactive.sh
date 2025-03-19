#!/bin/bash

docker run --rm -ti \
  -v $(pwd)/data/:/home/data \
  -v $(pwd)/output/:/home/output \
  --entrypoint /bin/bash \
  cuahsi/fimserv:latest
#  -v $(pwd)/generate_fim.py:/home/generate_fim.py \
