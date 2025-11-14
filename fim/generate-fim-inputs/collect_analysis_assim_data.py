#!/usr/bin/env python3

from os import error
import sys
import io
import json
import pandas
import urllib3
import requests
from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

import creds
import compute_rating_increments as cr

from tqdm import tqdm
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

base_url = "https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes"

API_KEY = creds.key
API_URL = creds.url

header = {"x-api-key": API_KEY}

ENDPOINT = f"{API_URL}/analysis-assim"

# use a global session for requests to limit the number of TCP connections
# that are created so that we don't overwhelm the API server. Using
# requests.get instead of session.get will create a new TCP connection
# for every call.
session = requests.Session()


class GatherData:
    def __init__(
        self,
        api_key,
        api_url="https://nwm-api.ciroh.org/",
        api_endpoint="analysis-assim",
        workers=5,
    ):
        self.url = f"{api_url}{api_endpoint}"
        self.header = {"x-api-key": api_key}
        self.df = None
        self.errors = {}
        self.workers = workers

    def fetch_url(self, params):
        try:
            response = session.get(self.url, params=params, headers=self.header)

            # Raise an exception for HTTP errors
            response.raise_for_status()
            return response

        except requests.exceptions.RequestException:
            return response
            # return f"Error fetching {self.url}: {e} -> {params}"

    def fetch_async(self, params_list):

        # Use ThreadPoolExecutor to make concurrent GET requests
        # TQDM is used to provide a nice looking progress bar
        with ThreadPoolExecutor(max_workers=self.workers) as executor:

            results = []

            # Submit all URLs to the executor
            future_to_url = {
                executor.submit(self.fetch_url, param): param for param in params_list
            }

            main_bar = tqdm(
                total=len(future_to_url),
                desc="Fetching Data",
                unit="url",
                colour="green",
                dynamic_ncols=True,
            )
            success_bar = tqdm(
                total=len(future_to_url),
                desc="Success",
                unit="ok",
                colour="blue",
                dynamic_ncols=True,
                position=1,  # place it below the main bar
            )
            error_bar = tqdm(
                total=len(future_to_url),
                desc="Errors",
                unit="err",
                colour="red",
                dynamic_ncols=True,
                position=2,  # place it below success bar
            )

            for future in tqdm(concurrent.futures.as_completed(future_to_url)):
                #                url = future_to_url[future]
                res = future.result()

                if res.ok:
                    # save the successful response
                    results.append(res)
                    success_bar.update(1)
                else:
                    # save the error so we can retry later
                    self.errors[
                        res.request.url.split("?")[1].split("&")[0].split("=")[1]
                    ] = res.reason
                    error_bar.update(1)
                main_bar.update(1)

            main_bar.close()
            success_bar.close()
            error_bar.close()

            # try:

            #     # # attempt to get the status code.
            #     # # if one is not returned, we should log
            #     # # it as an error.
            #     # status_code = res.status_code

            #     # # otherwise, the
            #     # results.append(res)

            # except Exception as e:
            #     errors.append(f"Exception for {url}: {e}")
            #     print(f"Exception for {url}: {e}")
            #     print(future)
            #     print(future.result())

            return results

    def collect_analysis_data(self, comids, start_time, end_time, parallel=True):

        # build a parameters to query
        params = [
            {
                "comids": comid,
                "start_time": start_time,
                "end_time": end_time,
                "output_format": "csv",
            }
            for comid in comids
        ]

        # query the api asynchronously with the parameters defined above
        if parallel:
            print("running in parallel mode")
            responses = self.fetch_async(params)

        else:
            print("running in serial mode")
            responses = []
            for param in params:
                responses.append(self.fetch_url(param))

        # filter out only the successful responses and
        # convert them into a single pandas dataframe
        successful_responses = [resp for resp in responses if resp.status_code == 200]
        # return responses, errors
        dfs = [
            pandas.read_csv(io.StringIO(res.text), sep=",")
            for res in successful_responses
        ]
        df = pandas.concat(dfs, ignore_index=True)

        # clean datetime columns and return
        df.time = pandas.to_datetime(df.time)

        self.df = df


def collect_reaches_from_gis_layers():
    # the following indices correspond to the Flowlines layer
    locations = {
        "DeSoto": 0,
        "MountAscutney": 0,
        "RoaringRiver": 13,
        "SpringfieldGreeneCounty": 1,
        "TwoRiversOttauquechee": 0,
        "Windham": 0,
    }
    params = {
        "where": "1=1",
        "geometryType": "esriGeometryEnvelope",
        "spatialRel": "esriSpatialRelIntersects",
        "units": "esriSRUnit_Foot",
        "outFields": "COMID,REACHCODE",
        "returnGeometry": "false",
        "returnDistinctValues": "true",
        "returnIdsOnly": "false",
        "returnCountOnly": "false",
        "returnExtentOnly": "false",
        "returnZ": "false",
        "returnM": "false",
        "multipatchOption": "xyFootprint",
        "returnTrueCurves": "false",
        "returnExceededLimitFeatures": "false",
        "returnCentroid": "false",
        "timeReferenceUnknownClient": "false",
        "sqlFormat": "none",
        "featureEncoding": "esriDefault",
        "f": "json",
    }

    riverids = {}
    for locname, layerid in locations.items():
        response = requests.get(
            f"{base_url}/{locname}/FeatureServer/{layerid}/query",
            params=params,
            verify=False,
        )

        data = response.json()
        if "error" in data.keys():
            print(
                f"\n * Error: {locname} - {data['error']['code']} - {data['error']['message']}\n"
            )
            continue

        comids = []
        if "features" in data:
            for feature in data["features"]:
                if "attributes" in feature and "COMID" in feature["attributes"]:
                    comids.append(
                        {
                            "reachid": feature["attributes"]["COMID"],
                            "huc8": feature["attributes"]["REACHCODE"][0:8],
                        }
                    )

        riverids[locname] = comids
        print(f"Found {len(comids)} rivers in {locname}")

    return riverids


def get_analysis_data_for_region(
    region_name,
    reaches,
    workers=5,
    start_date="2016-01-01",
    end_date=datetime.today().strftime("%Y-%m-%d"),
    num_retries=5,
):

    print(f"Collecting Data for {region_name}")

    reach_ids = [reach["reachid"] for reach in reaches[region_name]]

    gather_data = GatherData(creds.key, creds.url, workers=workers)

    gather_data.collect_analysis_data(reach_ids, start_date, end_date)

    df = gather_data.df

    # Begin URL retry
    current_retry = 0
    while current_retry < num_retries:
        failed_reach_ids = gather_data.errors
        if len(failed_reach_ids) > 0:
            print(
                f"Data Collection Failed for {len(failed_reach_ids)} Reaches (initiating retry {current_retry + 1})"
            )
            breakpoint()
            gather_data.errors = []  # reset errors object inside gather data class
            gather_data.collect_analysis_data(failed_reach_ids, start_date, end_date)

            # add the results to our original dataframe
            df = pandas.concat([df, gather_data.df])
        else:
            break

    return df


if __name__ == "__main__":
    reaches = collect_reaches_from_gis_layers()

    print("Found reaches in the following regions: ")
    i = 0
    for region_name in reaches.keys():

        print(f"  - [{i}] {region_name}")
        i += 1

    selected_region_id = -1
    while selected_region_id not in range(0, len(reaches.keys())):
        raw_input = input("Enter region number to process (or q to exit): ")
        if raw_input.strip().lower() == "q":
            sys.exit(1)
        else:
            try:
                selected_region_id = int(raw_input.strip())
            except Exception:
                selected_region_id = -1

    selected_region_name = list(reaches.keys())[selected_region_id]
    print(f"Begin processing [{selected_region_id}] - {selected_region_name}")

    df = get_analysis_data_for_region(selected_region_name, reaches)

    print(
        f"Number of reaches found in GIS: {len(pandas.DataFrame(reaches[selected_region_name]).reachid.unique())}"
    )
    print(f"Number of reaches data was collected for: {len(df.feature_id.unique())}")

    # save to parquet. If a parquet file already exists
    # combine with existing one then save to disk.
    parquet_file = Path(f"{selected_region_name.lower()}.parquet")
    if parquet_file.exists():
        existing_data = pandas.read_parquet(parquet_file)
        existing_data.set_index("time", inplace=True)

        # combine dataframes
        df = pandas.concat([existing_data, df], ignore_index=True)

    df.to_parquet(f"{selected_region_name.lower()}.parquet")
