#!/usr/bin/env python3

"""
Description: This script contains helper functions for collecting National 
             Water Model timeseries data using the BiGQuery API, located 
             at https://nwm-api.ciroh.org/

Author(s): Tony Castronova <acastronova@cuahsi.org>
"""

import io
import pandas
import requests
from enum import Enum
from typing import List, Union
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor


# import environment variables from config
from config import get_settings


class ForecastTypes(Enum):
    """
    CONUS Streamflow Forecast data available via nwm-api.ciroh.org
    https://nwm-api.ciroh.org/docs#/default/analysis_assim_analysis_assim_get

    - Short-Range Forecast: 18-hour deterministic (single value) forecast
    - Medium-Range Forecast: Six-member ensemble forecasts out to 10 days (member 1) and 8.5 days (members 2-6) initialized by standard analysis and forced by a time-lagged ensemble of GFS data
    - Long-Range Forecast: 30-day four-member ensemble forecast
    """

    SHORT = "short_range"
    MEDIUM = "medium_range"
    LONG = "long_range"


class Forecasts:
    def __init__(self):
        __settings = get_settings()
        self.url = f"{__settings.nwm_bigquery_url}/forecast"
        self.header = {"x-api-key": __settings.nwm_bigquery_key}
        self.df = pandas.DataFrame()

        self.ENSEMBLES = {
            ForecastTypes.SHORT: [0],
            ForecastTypes.MEDIUM: [0, 1, 2, 3, 4, 5],
            ForecastTypes.LONG: [0, 1, 2, 3],
        }

    def filter_forecast_ensembles(
        self, forecast_type: ForecastTypes, ensembles: Union[List[int], None] = None
    ):
        """
        Filters the ensembles, returning only those that exist in the given forecast type.

        Arguments:
        ==========
        forecast_type: ForecastType - The type of forecast to filter ensembles for.
        ensembles: Union[List[str], None] - A list of user-defined ensembles to filter, or None to return all ensembles (default: None).

        Returns:
        ========
        List: A list of valid ensembles for the specified forecast type.
        """

        if forecast_type not in self.ENSEMBLES:
            raise ValueError(f"Invalid forecast type: {forecast_type}")

        # get the valid ensembles for the given forecast type
        valid_ensembles = self.ENSEMBLES[forecast_type]

        # return the ensemble members that match the user input
        if ensembles is None:
            return valid_ensembles  # Return all IDs for the given forecast type
        else:
            return [i for i in ensembles if i in valid_ensembles]

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

    def collect_forecasts(
        self,
        comids: List[str],
        forecast_type: ForecastTypes,
        reference_times: List[str],
        ensembles: Union[List[int], None] = None,
    ):
        """
        :param ensembles: list or str - A list of user-defined ensembles to filter, or 'all' to return all ensembles.
        """

        # get ensembles
        valid_ensembles = self.filter_forecast_ensembles(
            forecast_type, ensembles=ensembles
        )

        # build a parameters to query
        params = [
            {
                "comids": ",".join(map(str, comids)),
                "forecast_type": forecast_type.value,
                "reference_time": reftime,
                "ensemble": ",".join(map(str, valid_ensembles)),
                "output_format": "csv",
            }
            for reftime in reference_times
        ]

        # query the api asynchronously with the parameters defined above
        responses, errors = self.fetch_async(params)
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
        df.reference_time = pandas.to_datetime(df.reference_time)

        self.df = df
