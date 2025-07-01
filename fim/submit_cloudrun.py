#!/usr/bin/env python


"""
The purpose of this script is to automate the process
of submitting Google CloudRun jobs for computing FIM.


Notes:

pip install google-auth google-auth-oauthlib google-api-python-client
"""

import time
from datetime import datetime
import json
from pathlib import Path
from typing import List
import typer
from rich.live import Live
from rich.table import Table
from rich.console import Console

from google.auth import default
from googleapiclient.discovery import build


app = typer.Typer()
console = Console()


PROJECT_ID = "com-res"
REGION = "us-central1"
JOB_NAME = "fimserv"


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


@app.command()
def run(file: Path):

    # Use ADC
    credentials, _ = default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    run_client = build("run", "v2", credentials=credentials)

    # Read lines (args)
    lines = [line.strip() for line in file.read_text().splitlines() if line.strip()]
    jobs = []

    # Start all jobs
    for line in lines:
        args = line.split(",")

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


if __name__ == "__main__":
    app()
