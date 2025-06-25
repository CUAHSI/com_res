#!/bin/bash

docker run --rm -ti -u root \
  -v $(pwd)/data/:/home/data \
  -v $(pwd)/output/:/home/output \
  -v $(pwd)/generate_fim.py:/home/generate_fim.py \
  cuahsi/fimserv:0.2 \
  reachfim_interval 11010001 8585030 1 2
