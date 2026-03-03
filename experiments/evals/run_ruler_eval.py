# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

"""Evaluate Llama-3.1-8B-Instruct on the RULER long-context benchmark.

Run via Ray with the eval extra for RULER deps (wonderwords, nltk):
  uv run lib/marin/src/marin/run/ray_run.py --cluster marin-us-central2 --tpu v4-8 --extra eval -- python -m experiments.evals.run_ruler_eval
"""

from experiments.evals.evals import default_eval
from experiments.evals.task_configs import RULER_TASKS_DEFAULT_LENGTH
from experiments.models import llama_3_1_8b_instruct
from fray.cluster import ResourceConfig
from marin.execution.executor import executor_main

ruler_eval_step = default_eval(
    step=llama_3_1_8b_instruct,
    resource_config=ResourceConfig.with_tpu("v4-8"),
    evals=list(RULER_TASKS_DEFAULT_LENGTH),
    apply_chat_template=True,
)

if __name__ == "__main__":
    executor_main(steps=[ruler_eval_step])
