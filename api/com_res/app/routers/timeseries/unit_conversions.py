#!/usr/bin/env python3


"""
This file contains utility functions for converting between
different units of measurement.
"""


def cms_to_cfs(flow_cms: float) -> float:
    """
    Converts cubic meters per second to cubic feet per second.

    Parameters:
    ==========
    flow_cms: float
        Flow in cubic meters per second.

    Returns:
    ========
    float:
        Flow in cubic feet per second.
    """
    return flow_cms * (3.28084**3)


def m_to_ft(meters):
    """
    Converts from meters to feet.

    Parameters:
    ==========
    meters: float
        Length in meters.

    Returns:
    ========
    float:
        Length in feet.
    """
    return meters * 3.28084


def ft_to_m(feet):
    """
    Converts from feet to meters.

    Parameters:
    ==========
    feet: float
        Length in feet.

    Returns:
    ========
    float:
        Length in meters.
    """
    return feet / 3.28084
