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
import pandas

import creds
import compute_rating_increments as cr

from tqdm import tqdm
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

base_url = "https://arcgis.cuahsi.org/arcgis/rest/services/CIROH-ComRes"

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
                            'region': locname,
                        }
                    )

        riverids[locname] = comids
        print(f"Found {len(comids)} rivers in {locname}")

    return pandas.concat([pandas.DataFrame(riverids[region]) for region in riverids.keys()], ignore_index=True)
