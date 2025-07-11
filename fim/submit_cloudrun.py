#!/usr/bin/env python


"""
The purpose of this script is to automate the process
of submitting Google CloudRun jobs for computing FIM.


Notes:

pip install google-auth google-auth-oauthlib google-api-python-client
"""

import re
import time
import json
import typer
from typing import List
from pathlib import Path
from rich.live import Live
from rich.table import Table
from datetime import datetime
from google.auth import default
from google.cloud import storage
from rich.console import Console
from typing_extensions import Annotated
from googleapiclient.discovery import build


app = typer.Typer()
console = Console()


PROJECT_ID = "com-res"
REGION = "us-central1"
JOB_NAME = "fimserv"
GCS_BUCKET_NAME = "com_res_fim_output"


def execute_job(run_client, args: List[str]):
    job_resource = f"projects/{PROJECT_ID}/locations/{REGION}/jobs/{JOB_NAME}"
    body = {"overrides": {"containerOverrides": [{"args": args}]}}
    request = run_client.projects().locations().jobs().run(name=job_resource, body=body)
    response = request.execute()
    return response["metadata"]["name"]  # returns execution id


def get_execution_status(run_client, execution_id):
    request = run_client._http.request(
        uri=f"https://run.googleapis.com/v2/{execution_id}",
        method="GET",
        headers={"Content-Type": "application/json"},
    )
    _, content = request
    response = json.loads(content)

    conditions = response.get("conditions", [])
    for condition in conditions:
        if condition.get("type") == "Completed":
            raw_state = condition.get("state")
            # Map Cloud Run states to human-readable ones
            return {
                "STATE_UNSPECIFIED": "PENDING",
                "CONDITION_PENDING": "PENDING",
                "CONDITION_RECONCILING": "RUNNING",
                "CONDITION_FAILED": "FAILED",
                "CONDITION_SUCCEEDED": "SUCCEEDED",
            }.get(raw_state, f"Unknown ({raw_state})")

    return "PENDING"


def show_progress_long(run_client, jobs):
    failed = []
    # Live status table
    TERMINAL_STATES = {"SUCCEEDED", "FAILED", "CANCELLED"}
    with Live(refresh_per_second=2) as live:
        while True:
            all_done = True
            table = Table(title="Cloud Run Job Status", expand=True)
            table.add_column("JobID", style="magenta")
            table.add_column("HUC8", style="green", no_wrap=True)
            table.add_column("ReachID", style="green", no_wrap=True)
            table.add_column("Status", style="gold1")
            table.add_column("Elapsed Minutes", style="white")

            for job in jobs:
                if job["status"] not in TERMINAL_STATES:
                    # only recheck the status of running jobs
                    job["status"] = get_execution_status(run_client, job["execution"])
                    elapsed_seconds = (
                        datetime.now() - job["start_time"]
                    ).total_seconds()
                    minutes, seconds = divmod(elapsed_seconds, 60)
                    job["elapsed_time"] = (
                        f"{round(minutes,0)} min {round(seconds,0)} sec"
                    )

                    if job["status"] == "FAILED":
                        failed.append(job["args"].split(",")[2])

                # add data to the table
                table.add_row(
                    job["execution"].split("/")[-1],
                    job["args"].split(",")[1],  # HUC8
                    job["args"].split(",")[2],  # ReachID
                    job["status"],
                    job["elapsed_time"],
                )

                # if one job is still running, we need to keep checking
                if job["status"] not in TERMINAL_STATES:
                    all_done = False

            # update the ui
            live.update(table)
            time.sleep(3)

            # exit if all jobs are done
            if all_done:
                break
    return failed


def show_progress_short(run_client, jobs):
    failed = []

    # Live status table
    TERMINAL_STATES = {"SUCCEEDED", "FAILED", "CANCELLED"}
    count_succeeded = 0
    with Live(refresh_per_second=2) as live:
        while True:
            all_done = True
            table = Table(title="Cloud Run Job Status", expand=True)
            table.add_column("Number of Jobs", style="magenta")
            table.add_column("Status", style="green", no_wrap=True)

            count_running = 0
            for job in jobs:
                if job["status"] not in TERMINAL_STATES:
                    # only recheck the status of running jobs
                    job["status"] = get_execution_status(run_client, job["execution"])

                    if job["status"] == "FAILED":
                        failed.append(job["args"].split(",")[2])
                        count_running -= 1
                    elif job["status"] == "SUCCEEDED":
                        count_succeeded += 1
                        count_running -= 1
                    else:
                        count_running += 1

                # if one job is still running, we need to keep checking
                if job["status"] not in TERMINAL_STATES:
                    all_done = False

            # add data to the table
            table.add_row(str(count_running), "Running")
            table.add_row(str(count_succeeded), "Succeeded")
            table.add_row(str(len(failed)), "Failed")

            # update the ui
            live.update(table)
            time.sleep(3)

            # exit if all jobs are done
            if all_done:
                break
    return failed


@app.command()
def run(file: Path, verbose: Annotated[bool, typer.Option("--verbose")] = False):

    # Use ADC
    credentials, _ = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    run_client = build("run", "v2", credentials=credentials)

    # Read lines (args)
    lines = [line.strip() for line in file.read_text().splitlines() if line.strip()]
    jobs = []

    print("Reading data stored in cloud bucket...", end="", flush=True)
    client = storage.Client()
    pattern = re.compile(r"^flood_[\d]+/[\d]+_inundation/\d+/")
    matching_dirs = []
    for blob in client.list_blobs(GCS_BUCKET_NAME):
        match = pattern.match(blob.name)
        if match:
            matching_dirs.append(match.group(0))
    print("done")

    failed_reachids = []
    if Path("failed_reachids.txt").exists():
        with open(Path("failed_reachids.txt"), "r") as f:
            failed_reachids = f.read().splitlines()

    # Start all jobs
    submitted_job_count = 0
    for line in lines:
        args = line.split(",")

        # skip jobs that already have been processed and saved in the output bucket
        out_dir_name_in_cloud = f"flood_{args[1]}/{args[1]}_inundation/{args[2]}/"
        if out_dir_name_in_cloud in matching_dirs:
            continue

        # skip jobs that have failed before
        if args[2] in failed_reachids:
            continue

        # pass the reachid as an argument so that outputs are saved in
        # a subdirectory named after the reachid
        args.append(f"{args[2]}")

        execution_id = execute_job(run_client, args)
        jobs.append(
            {
                "args": line,
                "execution": execution_id,
                "status": "Starting",
                "start_time": datetime.now(),
                "elapsed_time": "---",
            }
        )
        submitted_job_count += 1
        if submitted_job_count >= 140:
            print("Reached the maximum number of jobs to submit (140).")
            break

    print(f"Number of Jobns submitted: {submitted_job_count}")

    if verbose:
        failed = show_progress_long(run_client, jobs)
    else:
        failed = show_progress_short(run_client, jobs)

    # save the failed jobs to review later
    print(f"{len(failed)} jobs failed. See failed_reachids.txt for details.")
    with open("failed_reachids.txt", "a") as f:
        f.write("\n".join(failed))


if __name__ == "__main__":
    app()
