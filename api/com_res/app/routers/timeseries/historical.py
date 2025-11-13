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
from typing import Union

import pandas
import requests

# import environment variables from config
from config import get_settings

from . import unit_conversions as units


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

    def filter_analysis_assim_offsets(self, offsets: Union[str, list[str]] = "all") -> list[str]:
        """
        Filters the offsets, returning only those that exist in the analysis and assimilation dataset.

        Parameters
        ==========
        offsets : Union[str, list[str]]
            A string or list of user-defined offsets which will be filtered, or 'all' to return all offsets.

        Returns
        =======
        list[str]
            A list of valid offsets for the analysis and assimilation data.
        """

        # convert string to list if necessary
        if isinstance(offsets, str):
            offsets = [offsets]
        else:
            # make sure all offsets are strings
            offsets = [str(offset) for offset in offsets]

        if "all" in offsets:
            return [str(offset) for offset in self.OFFSETS]

        return [offset for offset in offsets if offset in {e.value for e in self.OFFSETS}]

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
            future_to_url = {executor.submit(self.fetch_url, param): param for param in params_list}

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

    def collect_analysis_assim(
        self,
        comids: list[str],
        start_time: str,
        end_time: str,
        offsets: Union[str, list[str]] = "all",
        si_units: bool = False,
    ) -> None:
        """
        Collects National Water Model Analysis and Assimilation timeseries data
        for the specified COMIDs and time range.

        Parameters
        ==========
        comids : list[str]
            A list of NWM COMIDs to collect data for.
        start_time : str
            A string representing the start time in the format '2020-12-25'
        end_time : str
            A string representing the end time in the format '2020-12-31'
        offsets : str or list
            A string or list of strings representing the analysis and assimilation offsets.
        si_units : bool
            A flag indicating whether to return data in SI units (True) or imperial units (False).

        Returns
        =======
        None, but sets the `df` attribute of the class to a pandas DataFrame containing the collected data.
        The resulting DataFrame will have the following format:

                     feature_id          time      streamflow  velocity
            0        3627605 2025-08-19  22:00:00  0.12        0.12
            1        3627605 2025-08-19  23:00:00  0.12        0.12
            2        3627605 2025-08-20  00:00:00  0.12        0.12
            3        3627605 2025-08-20  01:00:00  0.12        0.12
            4        3627605 2025-08-20  02:00:00  0.12        0.12
            ...

        """

        # get ensembles that are valid for analysis and assimilation
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
        dfs = [pandas.read_csv(io.StringIO(res.text), sep=",") for res in successful_responses]

        if len(dfs) > 1:
            df = pandas.concat(dfs, ignore_index=True)
        else:
            df = dfs[0]

        # clean datetime columns and return
        df.time = pandas.to_datetime(df.time)

        # convert the units to cfs if necessary
        if not si_units:
            # convert streamflow from cms to cfs
            df["streamflow"] = df["streamflow"].apply(units.cms_to_cfs)

            # convert vertical datum from meters per second to feet per second
            df["velocity"] = df["velocity"].apply(units.m_to_ft)

        self.df = df
