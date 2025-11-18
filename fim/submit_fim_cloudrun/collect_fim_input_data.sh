#!/bin/bash

# >>> dfs = []
# >>> for f in glob('*.txt'):
# ...     dfs.append(pandas.read_csv(f, names=['cmd','huc','reachid','flow','label'], dtype={'huc':str}))
# 
# >>> df = pandas.concat(dfs)
# >>> df.huc.unique()

ids=(01080103 01080104 01080105 01080106 07140101 10290106 10290107 11010002 01080107 01080201 01080202 01080203 02020003 11010001)

for id in "${ids[@]}"; do
    echo "=== Processing $id ==="
    target="gs://com_res_fim_output/flood_$id"
    src="s3://ciroh-owp-hand-fim/hand_fim_4_8_7_2/$id"
    #src="s3://ciroh-owp-hand-fim/hand_fim_4_5_2_11/$id"

    # download locally
    echo "  - downloading from S3..."
    aws s3 sync $src $id --no-sign-request --quiet

    #Copied /home/output/flood_07140101/07140101/branch_ids.csv to  /home/output/flood_07140101/fim_inputs.csv as fim_inputs.csv.

    
    
    # upload to gcs
    echo "  - uploading to GCS..."
    gsutil -m -q cp -r "${id}" "${target}/" 
    
    # remove local download
    echo "  - cleaning local download..."
    rm -rf $id

done
