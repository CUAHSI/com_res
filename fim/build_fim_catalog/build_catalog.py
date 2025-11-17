#!/usr/bin/env python3


"""
The purpose of this script is to build a catalog of all the FIM
maps that are stored on GCP.
"""

import pandas as pd
from google.cloud import storage
from google.cloud import bigquery


# gcs_bucket = "com_res_fim_output"
# prefix = ""
# extension = ".cog"
# output_dir = "./catalog"


def upload_to_gcs(local_file, bucket_name, dest_blob_name):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(dest_blob_name)
    blob.upload_from_filename(local_file)
    print(f"Uploaded to gs://{bucket_name}/{dest_blob_name}")


def gather_cog_fims(gcs_bucket, prefix="flood", extension=".cog"):
    # Connect to the GCS bucket and all the files matching the extension "cog" in
    # the all subdirectories. Save these as a list of paths.

    print(
        f"Gathering COG files in {gcs_bucket} with prefix '{prefix}' and extension '{extension}'...",
        end="",
    )
    client = storage.Client()
    bucket = client.bucket(gcs_bucket)
    blobs = client.list_blobs(bucket, prefix=prefix)
    matching_files = []
    for blob in blobs:
        if blob.name.endswith(extension):
            matching_files.append(f"gs://{gcs_bucket}/{blob.name}")
    print("done")

    print(f"Found {len(matching_files)} matching files")

    return matching_files


def create_bigquery_fim_records(fim_files, extension=".cog"):
    # organize the matching files by reach id
    # extract FIM attributes and save them for building
    # that catalog later on.
    items = []
    for url in fim_files:
        filename_parts = url.split("/")[-1].split("__")
        item_id = url.split("/")[-1].replace(extension, "")
        reach_id = int(filename_parts[0])
        stage = float(".".join(filename_parts[1].split("_")[0:2]))
        flow = float(filename_parts[2].split("_")[0])

        dat = {
            "item_id": item_id,
            "reach_id": reach_id,
            "stage": stage,
            "flow": flow,
            "asset_url": url,
            "public_url": f'https://storage.googleapis.com/{fim_files[0].replace("gs://", "")}',
        }

        items.append(dat)

    df = pd.DataFrame(items)

    return df


def load_fim_records_to_bigquery(
    df, gcs_bucket, table_id="com-res.flood_data.fim_catalog"
):

    # save the dataframe to jsonl and upload it to the bucket
    df.to_json("fim_catalog_index.jsonl", orient="records", lines=True)
    upload_to_gcs("fim_catalog_index.jsonl", gcs_bucket, "fim_catalog_index.jsonl")

    # load the jsonl into bigquery
    client = bigquery.Client()

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    load_job = client.load_table_from_uri(
        f"gs://{gcs_bucket}/fim_catalog_index.jsonl", table_id, job_config=job_config
    )

    load_job.result()  # Wait for job to complete

    print(f"Loaded {load_job.output_rows} rows to {table_id}")


if __name__ == "__main__":

    # gather all COFG FIM files from GCS
    fims = gather_cog_fims("com_res_fim_output", "flood")

    # create a dataframe with FIM attributes
    df = create_bigquery_fim_records(fims)

    # load the dataframe into bigquery
    load_fim_records_to_bigquery(df, "com_res_fim_output")


# def build_stac():
#     # create stac catalog

#     # Connect to the GCS bucket and all the files matching the extension "cog" in
#     # the all subdirectories. Save these as a list of paths.
#     print(
#         f"Gathering COG files in {gcs_bucket} with prefix '{prefix}' and extension '{extension}'...",
#         end="",
#         flush=True,
#     )
#     client = storage.Client()
#     bucket = client.bucket(gcs_bucket)
#     blobs = client.list_blobs(bucket, prefix=prefix)
#     matching_files = []
#     for blob in blobs:
#         if blob.name.endswith(extension):
#             matching_files.append(f"gs://{gcs_bucket}/{blob.name}")
#     print("done")

#     print(f"Found {len(matching_files)} matching files")

#     # organize the matching files by reach id
#     # extract FIM attributes and save them for building
#     # that catalog later on.
#     print("Extracting attributes from matching files...", end="", flush=True)
#     items = {}
#     for url in matching_files:
#         filename_parts = url.split("/")[-1].split("__")
#         item_id = url.split("/")[-1].replace(extension, "")
#         reach_id = int(filename_parts[0])
#         stage = float(".".join(filename_parts[1].split("_")[0:2]))
#         flow = float(filename_parts[2].split("_")[0])

#         dat = {
#             "url": url,
#             "item_id": item_id,
#             "reach_id": reach_id,
#             "stage": stage,
#             "flow": flow,
#         }
#         if reach_id not in items.keys():
#             items[reach_id] = [dat]
#         else:
#             items[reach_id].append(dat)
#     print("done")

#     # Create the STAC Catalog
#     print("Building STAC catalog...", end="", flush=True)
#     # # remove the catalog directory if it exists
#     if Path(output_dir).exists():
#         shutil.rmtree(output_dir)

#     catalog = pystac.Catalog(
#         id="fim-data-catalog", description="Flood maps indexed by id, stage, and flow"
#     )

#     # For each reach_id, create a sub-catalog and add items
#     for reach_id, items_for_id in items.items():
#         sub_catalog = pystac.Catalog(
#             id=f"reach-{reach_id}", description=f"Catalog for reach_id {reach_id}"
#         )
#         catalog.add_child(sub_catalog)

#         for attrs in items_for_id:

#             stac_item = pystac.Item(
#                 id=attrs["item_id"],
#                 geometry=None,
#                 bbox=None,
#                 datetime=datetime(
#                     1970, 1, 1, 0, 0, 0
#                 ),  # placeholder because this parameter is required
#                 properties={
#                     "id": attrs["reach_id"],
#                     "stage": attrs["stage"],
#                     "flow": attrs["flow"],
#                 },
#             )

#             stac_item.add_asset(
#                 "cog",
#                 pystac.Asset(
#                     href=attrs["url"],
#                     media_type=pystac.MediaType.COG,
#                     roles=["data"],
#                     title="Cloud Optimized GeoTiff",
#                 ),
#             )

#             sub_catalog.add_item(stac_item)

#         # Save the sub-catalog to its folder
#         sub_catalog_dir = os.path.join(output_dir, f"reach-{reach_id}")
#         os.makedirs(sub_catalog_dir, exist_ok=True)
#         sub_catalog.normalize_and_save(
#             root_href=sub_catalog_dir, catalog_type=pystac.CatalogType.SELF_CONTAINED
#         )

#     # Save the root catalog
#     catalog.normalize_and_save(
#         root_href=output_dir, catalog_type=pystac.CatalogType.SELF_CONTAINED
#     )
#     print("done")

#     print(f"STAC catalog built and saved to: {output_dir}")


# def flatten_stac_items(catalog_path: str) -> pd.DataFrame:
#     root_catalog = pystac.Catalog.from_file(str(Path(catalog_path) / "catalog.json"))

#     rows = []
#     for item in root_catalog.get_all_items():
#         row = {
#             "item_id": item.id,
#             "reach_id": item.properties.get("id"),
#             "stage": item.properties.get("stage"),
#             "flow": item.properties.get("flow"),
#             "datetime": item.datetime.isoformat() if item.datetime else None,
#             "asset_url": item.assets["cog"].href if "cog" in item.assets else None,
#             "public_url": f'https://storage.googleapis.com/{item.assets["cog"].href.replace("gs://", "")}',
#         }
#         rows.append(row)

#     return pd.DataFrame(rows)


# def load_stac_to_bigquery(gcs_uri: str, table_id: str):

#     client = bigquery.Client()

#     job_config = bigquery.LoadJobConfig(
#         source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
#         autodetect=True,
#         write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
#     )

#     load_job = client.load_table_from_uri(gcs_uri, table_id, job_config=job_config)
#     load_job.result()  # Wait for job to complete
#     print(f"\tLoaded {load_job.output_rows} rows to {table_id}")


# def create_bigquery_catalog():
#     print("Flattening STAC items into a DataFrame...", end="", flush=True)
#     df = flatten_stac_items("catalog")
#     df.to_json("fim_catalog_index.jsonl", orient="records", lines=True)
#     print("done")

#     print("Uploading JSONL file to GCS...", flush=True)
#     upload_to_gcs(
#         "fim_catalog_index.jsonl", "com_res_fim_output", "fim_catalog_index.jsonl"
#     )

#     print("Loading STAC items into BigQuery...", end="", flush=True)
#     load_stac_to_bigquery(
#         "gs://com_res_fim_output/fim_catalog_index.jsonl",
#         "com-res.flood_data.fim_catalog",
#     )
#     print("done")


# if __name__ == "__main__":
#     print("\n--- Creating STAC catalog from FIM stored in GCP ---")
#     build_stac()

#     print("\n--- Creating BigQuery catalog from STAC items ---")
#     create_bigquery_catalog()

#     print("\n--- Catalog building complete. ---")
