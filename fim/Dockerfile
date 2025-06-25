FROM mambaorg/micromamba:debian12-slim

WORKDIR /home
USER root

# Install System dependencies
RUN apt update \
 && apt install -y \
 curl \
 libhdf5-dev \
 libnetcdf-dev \
 git \
 awscli

USER $MAMBA_USER

# Install Python dependencies
RUN micromamba install -y \
  python==3.10 \
  pip \
  typer

# Perform initial clone of flood_inundation code so this doesn't need to be done everytime.
# Something related to Numba and Geocube changed after this SHA was created 
# which caused the mosaicing process to fail.
ENV SHA=9d39cb85ae789b30964a82c19dd850d29fccf5df
RUN git clone --depth 1 https://github.com/NOAA-OWP/inundation-mapping.git /home/code/inundation-mapping \
 && cd /home/code/inundation-mapping \
 && git fetch origin ${SHA} \
 && git checkout ${SHA}


# Install FIMServ and remove source after installation
# Patch the FIMServ library to allow running flood_inundation calculations
# concurrently without merging the wrong output files.
RUN git clone https://github.com/sdmlua/FIMserv.git /home/code/FIMServ 
COPY runFIM.py /home/code/FIMServ/src/fimserve/runFIM.py
RUN cd /home/code/FIMServ \
 && /opt/conda/bin/pip install -e . 
# && rm -rf /tmp/FIMServ

COPY generate_fim.py /home/generate_fim.py
COPY compute_rating_increments.py /home/compute_rating_increments.py


# Set bash as the default command
ENTRYPOINT ["/opt/conda/bin/python", "generate_fim.py"]
CMD ["--help"]




