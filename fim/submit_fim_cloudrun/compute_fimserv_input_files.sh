#!/bin/bash


ids=(01080103 01080104 01080105 01080106 07140101 10290106 10290107 11010002 01080107 01080201 01080202 01080203 02020003 11010001)

# make a directory to store files
mkdir -p workflow_data

# DOWNLOAD BRANCH_IDS AND HYDROTABLES
for id in "${ids[@]}"; do
    echo "=== Processing $id ==="
    target="gs://com_res_fim_output/flood_$id"
    src="s3://ciroh-owp-hand-fim/hand_fim_4_8_7_2/$id"

    # download locally
    echo "  - downloading from S3..."
    aws s3 cp $src/branch_ids.csv ./workflow_data/${id}_branch_ids.csv --no-sign-request --quiet
    aws s3 cp $src/hydrotable.csv ./workflow_data/${id}_hydrotable.csv --no-sign-request --quiet

done

# create feature_id csv files
python identify_unique_reaches.py

# upload Branch_IDS as 'FIM_INPUTS'
for file in workflow_data/*_branch_ids.csv; do
    # Skip if no files matched
    [ -e "$file" ] || continue

    echo "Processing $file"
    
    # Get just the filename (strip directory)
    filename=$(basename "$file")

    # Extract unique ID (strip suffix)
    uniqueid="${filename%_branch_ids.csv}"

    target="gs://com_res_fim_output/flood_$uniqueid/fim_inputs.csv"
    gsutil -m -q cp "workflow_data/${filename}" "${target}" 

done


# upload Feature_IDS
for file in workflow_data/*_feature_IDs.csv; do
    # Skip if no files matched
    [ -e "$file" ] || continue

    echo "Processing $file"
    
    # Get just the filename (strip directory)
    filename=$(basename "$file")

    # Extract unique ID (strip suffix)
    uniqueid="${filename%_feature_IDs.csv}"

    target="gs://com_res_fim_output/flood_$uniqueid/feature_IDs.csv"
    gsutil -m -q cp "workflow_data/${filename}" "${target}" 
    
done



