#!/usr/bin/env python3



import pandas
import matplotlib
import matplotlib.pyplot as plt
import  matplotlib.dates as mdates

def align_quantiles_with_timeseries(quantiles: pandas.DataFrame, dates: pandas.Series):
    """
    Aligns quantiles, computed based on "day of year", with a provided pandas Series
    of dates in datetime[64] format.
    """
    dfs = []

    # make sure dates are in the correct format
    dates = pandas.to_datetime(dates)

    # loop through the unique days associated with the series
    # and find the day of year that matches each one. Save these
    # to a list of DataFrames that can be concatted later.
    for date in dates.floor('D').drop_duplicates():
        dat = quantiles.loc[quantiles.doy == date.dayofyear].copy()
        dat['datetime'] = date
        dfs.append(dat)

    out_series = pandas.concat(dfs, ignore_index=True)
    out_series.datetime = pandas.to_datetime(out_series.datetime)
    out_series = out_series.sort_values(by='datetime')
    out_series.set_index('datetime', inplace=True)
    return out_series

def create_quantile_plot(quantiles: pandas.DataFrame, xfield='datetime', xlabel='Date'):

        
    fig = plt.figure(figsize=(8, 6))
    ax = fig.add_subplot(111);
    
    # create a copy of the input data so that our manipulations
    # don't modify the orginal dataset
    dat = quantiles.copy()
    
    reach_id = quantiles.feature_id.unique()[0]


    dat.reset_index(inplace=True)    

    x_data = pandas.to_datetime(dat[xfield])
    
    ax.fill_between(
        x_data,          # x values
        dat.q0,            # lower bound
        dat.q10,            # upper bound
        color='brown',             # fill color
        alpha=0.2,                # transparency
        label='Much below normal'       # legend label
    )
    
    ax.fill_between(
        x_data,          # x values
        dat.q10,            # lower bound
        dat.q25,            # upper bound
        color='orange',             # fill color
        alpha=0.2,                # transparency
        label='Below normal'       # legend label
    )
    
    ax.fill_between(
        x_data,          # x values
        dat.q25,            # lower bound
        dat.q75,            # upper bound
        color='green',             # fill color
        alpha=0.2,                # transparency
        label='Normal'       # legend label
    )
    
    ax.fill_between(
        x_data,          # x values
        dat.q75,            # lower bound
        dat.q90,            # upper bound
        color='teal',             # fill color
        alpha=0.2,                # transparency
        label='Above normal'       # legend label
    )

    ax.fill_between(
        x_data,          # x values
        dat.q75,            # lower bound
        dat.q90,            # upper bound
        color='darkblue',             # fill color
        alpha=0.2,                # transparency
        label='Much Above Normal'       # legend label
    )

    ax.set_ylabel('Streamflow (cms)')
    #ax.set_xlabel(xlabel)
    ax.set_title(f'Reach {reach_id}')
    ax.set_xlim([x_data.min(), x_data.max()])
    ax.tick_params(axis='x', labelrotation=45)
    ax.grid()
    

    ax.set_yscale('log')
    ax.yaxis.set_major_formatter(matplotlib.ticker.FormatStrFormatter('%d'))

    legend = ax.legend(
        loc='upper center',
        bbox_to_anchor=(0.5, -0.12),
        ncol=3,
        frameon=False
    )
    fig.subplots_adjust(bottom=0.25)  

    return fig, ax