#!/usr/bin/env python3

"""
Description: This script contains helper functions for generating  
             an interactive map containing Water Model features.

Author(s): Tony Castronova <acastronova@cuahsi.org>
"""

import json

import geopandas as gpd
import ipyleaflet
import requests
import shapely
from ipywidgets import Layout
from sidecar import Sidecar


class Map:
    def __init__(self, basemap=ipyleaflet.basemaps.OpenStreetMap.Mapnik, gdf=None, plot_gdf=False, name='Map'):
        self.selected_id = None
        self.selected_layer = None

        self.basemap = basemap
        self.name = name

        self.map = self.build_map()

    def build_map(self):
        defaultLayout = Layout(width='960px', height='940px')

        m = ipyleaflet.Map(
            basemap=ipyleaflet.basemap_to_tiles(ipyleaflet.basemaps.OpenStreetMap.Mapnik, layout=defaultLayout),
            center=(45.9163, -94.8593),
            zoom=9,
            scroll_wheel_zoom=True,
            tap=False,
        )

        m.add_layer(
            ipyleaflet.WMSLayer(
                url='https://maps.water.noaa.gov/server/services/reference/static_nwm_flowlines/MapServer/WMSServer',
                layers='0',
                transparent=True,
                format='image/png',
                min_zoom=8,
                max_zoom=18,
            )
        )

        # add USGS Gages
        m.add_layer(
            ipyleaflet.WMSLayer(
                url='http://arcgis.cuahsi.org/arcgis/services/NHD/usgs_gages/MapServer/WmsServer',
                layers='0',
                transparent=True,
                format='image/png',
                min_zoom=8,
                max_zoom=18,
            )
        )
        # bind the map handler function
        m.on_interaction(self.handle_map_interaction)

        return m

    def asInlineMap(self):
        display(self.map)

    def asSideCarMap(self):

        sc = Sidecar(title=self.name)
        with sc:
            display(self.map)

    def action_after_map_click(self):
        # Method can be implemented by Subclasses to provide additional
        # additional functionality after a NWM reach has been selected.
        pass

    def handle_map_interaction(self, **kwargs):

        if kwargs.get('type') == 'click':

            # remove the previously selected layers
            if self.selected_layer is not None:
                self.map.remove(self.selected_layer)
                self.selected_layer = None

            # get the mouse coordinates, convert to a point,
            # buffer it, then find the reach that interects with it.
            #
            # buffer the selected point by a small degree. This
            # is a hack for now and Buffer operations should only
            # be applied in a projected coordinate system in the future.
            lat, lon = kwargs['coordinates']
            point = shapely.Point(lon, lat)
            pt_buf = point.buffer(0.001)

            # Convert Shapely Polygon to ArcGIS JSON format
            geometry = {
                "rings": [[list(coord) for coord in pt_buf.exterior.coords]],
                "spatialReference": {"wkid": 4326},
            }

            url = (
                "https://maps.water.noaa.gov/server/rest/services/reference/static_nwm_flowlines/FeatureServer/0/query"
            )
            params = {
                "geometry": f"{geometry}",
                "geometryType": "esriGeometryPolygon",
                "spatialRel": "esriSpatialRelIntersects",
                "outFields": "*",
                "returnGeometry": "true",
                "f": "geojson",
            }
            response = requests.get(url, params=params)
            data = response.json()

            if "features" in data and data["features"]:

                # Convert features to Shapely geometries
                flowlines = [
                    (shapely.geometry.shape(feature["geometry"]), feature["properties"]) for feature in data["features"]
                ]

                # Find the nearest flowline to the buffered polygon
                nearest_line, nearest_properties = min(flowlines, key=lambda item: pt_buf.distance(item[0]))
                self.set_selected(nearest_properties['feature_id'])

                # Convert nearest flowline to GeoJSON format
                self.nearest_geojson = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": json.loads(gpd.GeoSeries([nearest_line]).to_json())["features"][0]["geometry"],
                            "properties": {"name": "Nearest Flowline"},
                        }
                    ],
                }

                self.map.add_layer(ipyleaflet.GeoJSON(data=self.nearest_geojson, style={"color": "red", "weight": 3}))

                # save this layer as the selected_layer
                self.selected_layer = self.map.layers[-1]

            else:
                self.nearest_geojson = None
                self.set_selected(None)

            # call the after_reach_selected function.
            # this is intended to enable extra functionality
            # that can be implemented in subclasses
            self.action_after_map_click()

    # setter for the selected reach
    def set_selected(self, value):
        self.selected_id = value

    # getter for selected reach
    def selected(self):
        return self.selected_id
