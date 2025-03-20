#!/bin/bash

docker run --rm -ti -u root \
  -v $(pwd)/generate_fim.py:/home/a.py:Z \
  --entrypoint /bin/bash \
  cuahsi/fimserv:latest
#  -v $(pwd)/data/:/home/data \
#  -v $(pwd)/output/:/home/output \
