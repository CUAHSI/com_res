# FIM Generation

This directory contains the code to generate the FIM layers
that are displayed in the web application. This is made possible
by combining two existing community efforts into a containerized
workflow. These community efforts are:

- `https://github.com/NOAA-OWP/inundation-mapping`
- `https://github.com/sdmlua/FIMserv`

To run this workflow you'll need to perform the following steps:

1. Build the Docker image

  `docker build -t cuahsi/fimserv:latest .`

2. Make directories to mount data in and out of the container

  `mkdir data`

  `mkdir output`

3. Run the image

  `run.sh <args>`

  alternatively, you can run the image with the following command to run in debug mode:

  `run-interactive.sh`
