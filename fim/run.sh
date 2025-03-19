#!/bin/bash

ARGS=$1

docker run --rm -ti \
  -v $(pwd)/data/:/home/data \
  -v $(pwd)/output/:/home/output \
  cuahsi/fimserv:latest \
  $ARGS
