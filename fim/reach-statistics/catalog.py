#!/usr/bin/env python3



"""
This file contains utility functions for creating BigQuery catalogs in 
the Google Cloud Platform.
"""

import pandas as pd
from google.cloud import storage
from google.cloud import bigquery



def upload_to_gcs(local_file, bucket_name, dest_blob_name):
    """
    Uploads a local file to a specified cloud bucket
    """
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)
    blob.upload_from_filename(local_file)
    print(f"Uploaded to gs://{bucket_name}/{dest_blob_name}")



def load_json_to_bigquery(remote_json_uri: str, table_id: str):
    """
    Loads a JSONL file into bigquery
    """
    client = bigquery.Client()

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    load_job = client.load_table_from_uri(remote_json_uri, table_id, job_config=job_config)
    load_job.result()  # Wait for job to complete
    print(f"Loaded {load_job.output_rows} rows to {table_id}")

def pandas_to_jsonl(df, columns=[]):
    """
    Converts a Pandas DataFrame into a JSONL file that can
    be uploaded to BigQuery.

    dat = {
        'item_id': item_id,
        'reach_id': reach_id,
        'stage': stage,
        'flow': flow,
        "asset_url": url,
        "public_url": f'https://storage.googleapis.com/{matching_files[0].replace("gs://", "")}'
    }
    """
    return df.to_json(orient='records', lines=True)








    