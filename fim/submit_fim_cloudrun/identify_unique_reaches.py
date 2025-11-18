#!/usr/bin/env python3

import os
import pandas
from glob import glob
from pathlib import Path


data_path = Path('workflow_data')

for hydrotable in glob('workflow_data/*hydrotable.csv'):
    df = pandas.read_csv(hydrotable, usecols=['feature_id'])
    p = Path(hydrotable)
    
    
    outname = p.name.replace('hydrotable','feature_IDs')
    
    dat = df['feature_id'].drop_duplicates(keep='first').sort_values(ascending=False)
    dat.to_csv(data_path/outname, index=False)

    