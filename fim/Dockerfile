FROM mambaorg/micromamba:debian12-slim

WORKDIR /home
USER root

# Install System dependencies
RUN apt update \
 && apt install -y \
 curl \
 libhdf5-dev \
 libnetcdf-dev \
 git 

USER $MAMBA_USER

# Install Python dependencies
RUN micromamba install -y \
  python==3.10 \
  pip \
  typer

# Perform initial clone of flood_inundation code so this doesn't need to be done everytime.
## TODO: Consider updating it via git pull within FIMServ
RUN git clone https://github.com/NOAA-OWP/inundation-mapping.git /home/code/inundation-mapping

# Install FIMServ and remove source after installation
RUN git clone https://github.com/sdmlua/FIMserv.git /tmp/FIMServ \
 && cd /tmp/FIMServ \
 && /opt/conda/bin/pip install . \
 && rm -rf /tmp/FIMServ

COPY generate_fim.py /home/generate_fim.py

# Set bash as the default command
ENTRYPOINT ["/opt/conda/bin/python", "generate_fim.py"]
CMD ["--help"]




