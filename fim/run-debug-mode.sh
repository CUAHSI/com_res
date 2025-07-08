#!/bin/bash

docker run --rm -ti -u root \
  -v $(pwd)/data/:/home/data \
  -v $(pwd)/output/:/home/output \
  -v $(pwd)/generate_fim.py:/home/generate_fim.py \
  -v $(pwd)/compute_rating_increments.py:/home/compute_rating_increments.py \
  --entrypoint /bin/bash \
  cuahsi/fimserv:0.2

#-v $(pwd)/code:/home/code \
#-v $(pwd)/generate_fim_argo.py:/home/generate_fim_argo.py \
#-v $(pwd)/generate_fim.py:/home/generate_fim.py \
#-v $(pwd)/compute_rating_increments.py:/home/compute_rating_increments.py \
