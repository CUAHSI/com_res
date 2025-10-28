#!/usr/bin/env python3


"""
This file contains helper functions for working with the S3
backend of HydroShare. Eventually some of these concepts will
be incorporated into hydroshare/hsclient.
"""

import getpass
import requests
from pathlib import Path
import concurrent.futures

import s3fs
import xarray
from tqdm import tqdm
from hsclient import HydroShare, Resource

import logging

class S3Resource(Resource):
    def __init__(self, resource_path: str, hs_session, logger):
        super().__init__(resource_path, hs_session)
        
        self.logger = logger
        
        # store the s3 path for this resource
        self.s3_path = self.__get_resource_s3_path()
        self.logger.info('s3Path =  ' + str(self.s3_path))
            
    def __get_resource_s3_path(self) -> str:
        self.logger.info(f'resource_id={self.resource_id}')
        resource_id = self.resource_id
        response = self._hs_session.get(f"hsapi/resource/s3/{resource_id}/", status_code=200)
        
        return f"{response.json()['bucket']}/{response.json()['prefix']}"

    def __build_remote_s3_path(self, prefix='') -> str:
        if prefix:
            return f'{self.s3_path}{prefix}'
        return self.s3_path
        
    def s3_ls(self, prefix:str = '', refresh=False) -> list:
        """
        Lists the files in a HydroShare resource using S3FS.
        """
        
        remote_path = self.__build_remote_s3_path(prefix)
        return self._hs_session.s3.ls(remote_path, refresh=refresh)

    def __put_file(self, local_path, remote_path):
        try:
            self._hs_session.s3.put(local_path, remote_path)
        except Exception as e:
            self.logger.info(f"Error uploading {local_path}: {e}")
        
    def s3_put(self, file: Path, prefix: str = '') -> None:
        """
        Uploads a single file to a HydroShare resource using the S3 backend
        """

        remote_path = self.__build_remote_s3_path(prefix)
        self.__put_file(str(file), remote_path)
        

    def s3_put_many(self, files: [], prefix: str = '', max_workers: int = 5) -> None:
        """
        Uploads many files to a HydroShare resource using the S3 backend and concurrent.futures
        """
        
        remote_path = self.__build_remote_s3_path(prefix)
        cleaned_paths = [str(f) for f in files]
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(tqdm(executor.map(self.__put_file,
                                             cleaned_paths,
                                             len(cleaned_paths) * [remote_path]),
                                total=len(cleaned_paths)))
            
class S3HydroShare(HydroShare):
    def __init__(self, **kwargs):
        self.s3_key = None
        self.s3_secret = None
        
        # setup logging to control output verbosity
        log_level = kwargs.pop('log_level', 'ERROR')
        self.__setup_logging(log_level)

        # initialize parent
        super().__init__(**kwargs)
        
        # force sign in during intialization so we can 
        # set up the S3 connection for use later.
        #if (self.username is None) or (self.password is None):
        self.sign_in()

        # store S3FileSystem in the session
        self._hs_session.s3 = s3fs.S3FileSystem(key=self.s3_key,
                                    secret=self.s3_secret,
                                    endpoint_url=f"https://s3.{self._hs_session.host.replace('www.','')}")
    
    def __setup_logging(self, log_level):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        self.logger.setLevel(log_level.upper())  # Set per-instance level

        # Add a handler only if not already present
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            
    def sign_in(self) -> None:
        """
        Prompts for username/password. 
        Useful for avoiding saving your HydroShare credentials to a notebook
        """
        username = input("Username: ").strip()
        password = getpass.getpass("Password for {}: ".format(username))
        self._hs_session.set_auth((username, password))
        self.my_user_info()  # validate credentials

        # get S3 credentials
        self.logger.info('Getting S3 credentials')
        try:
            response = requests.post(f"https://{self._hs_session.host}/hsapi/user/service/accounts/s3/",
                                     auth=(username, password))
            self.s3_key, self.s3_secret = response.json().values()
        except Exception as e:
            print(response.status_code)
            print(response.json())
            raise e

    def resource(self, resource_id: str, validate: bool = True, use_cache: bool = True) -> S3Resource:
        """
        Creates a resource object from HydroShare with the provided resource_id
        :param resource_id: The resource id of the resource to retrieve
        :param validate: Defaults to True, set to False to not validate the resource exists
        :param use_cache: Defaults to True, set to False to skip the cache, and always retrieve the
            resource from HydroShare. This parameter also does not cache the retrieved Resource
            object.
        :return: A Resource object representing a resource on HydroShare
        """
        if resource_id in self._resource_object_cache and use_cache:
            return self._resource_object_cache[resource_id]

        res = S3Resource("/resource/{}/data/resourcemap.xml".format(resource_id),
                         self._hs_session,
                         self.logger)
        if validate:
            _ = res.metadata

        if use_cache:
            self._resource_object_cache[resource_id] = res
            
        return res