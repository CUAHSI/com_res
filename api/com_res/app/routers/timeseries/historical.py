#!/usr/bin/env python3

"""
Description: This script contains helper functions for collecting National 
             Water Model timeseries data using the BiGQuery API, located 
             at https://nwm-api.ciroh.org/

Author(s): Tony Castronova <acastronova@cuahsi.org>
"""

import concurrent.futures
import io
from concurrent.futures import ThreadPoolExecutor
from enum import Enum

import pandas
import requests

# import environment variables from config
from config import get_settings


class Offsets(Enum):
    """
    CONUS Streamflow Analysis and Assimilation data available via nwm-api.ciroh.org
    https://nwm-api.ciroh.org/docs#/default/analysis_assim_analysis_assim_get

    run_offset (int): The analysis_assim result time offset. Supported values are 1, 2, and 3.

    """

    OFFSET_1 = "1"
    OFFSET_2 = "2"
    OFFSET_3 = "3"


class AnalysisAssim:
    def __init__(self):
        __settings = get_settings()
        self.url = f"{__settings.nwm_bigquery_url}/analysis-assim"
        self.header = {"x-api-key": __settings.nwm_bigquery_key}
        self.df = pandas.DataFrame()

        self.OFFSETS = [
            Offsets.OFFSET_1,
            Offsets.OFFSET_2,
            Offsets.OFFSET_3,
        ]

    def filter_analysis_assim_offsets(self, offsets="all"):
        """
        Filters the offsets, returning only those that exist in the analysis and assimilation dataset.

        :param offsets: list or str - A list of user-defined offsets to filter, or 'all' to return all offsets.
        :return: A list of valid offsets for the analysis and assimilation dataset.
        """

        if offsets == "all":
            return self.OFFSETS

        return [offset for offset in offsets if id in self.OFFSETS]

    def fetch_url(self, params):
        try:
            response = requests.get(self.url, params=params, headers=self.header)

            # Raise an exception for HTTP errors
            response.raise_for_status()
            return response

        except requests.exceptions.RequestException as e:
            return f"Error fetching {self.url}: {e}"

    def fetch_async(self, params_list):

        results = []
        errors = []

        # Use ThreadPoolExecutor to make concurrent GET requests
        # TQDM is used to provide a nice looking progress bar
        with ThreadPoolExecutor(max_workers=5) as executor:

            # Submit all URLs to the executor
            future_to_url = {
                executor.submit(self.fetch_url, param): param for param in params_list
            }

            # Process the results as they complete
            for future in concurrent.futures.as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    res = future.result()

                    # attempt to get the status code.
                    # if one is not returned, we should log
                    # it as an error.
                    status_code = res.status_code

                    # otherwise, the
                    results.append(res)

                except Exception as e:
                    errors.append(f"Exception for {url}: {e}")

            return results, errors

    def collect_analysis_assim(self, comids, start_time, end_time, offsets="all"):

        # get ensembles
        valid_offsets = self.filter_analysis_assim_offsets(offsets)

        # build a parameters to query
        params = {
            "comids": ",".join(map(str, comids)),
            "start_time": start_time,
            "end_time": end_time,
            "offsets": ",".join(map(str, valid_offsets)),
            "output_format": "csv",
        }

        # query the api asynchronously with the parameters defined above
        responses, errors = self.fetch_async([params])
        # TODO: do something if we encounter an error.

        # filter out only the successful responses and
        # convert them into a single pandas dataframe
        successful_responses = [resp for resp in responses if resp.status_code == 200]
        dfs = [
            pandas.read_csv(io.StringIO(res.text), sep=",")
            for res in successful_responses
        ]

        if len(dfs) > 1:
            df = pandas.concat(dfs, ignore_index=True)
        else:
            df = dfs[0]

        # clean datetime columns and return
        df.time = pandas.to_datetime(df.time)

        self.df = df
