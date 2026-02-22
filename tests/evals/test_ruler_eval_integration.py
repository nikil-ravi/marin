# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

from experiments.evals.task_configs import (
    RULER_TASKS_DEFAULT_LENGTH,
    convert_to_levanter_task_config,
    ruler_tasks_with_max_seq_lengths,
)
from marin.evaluation.evaluation_config import EvalTaskConfig
from marin.evaluation.evaluators.levanter_lm_eval_evaluator import _resolve_lm_eval_max_length
from marin.evaluation.evaluators.lm_evaluation_harness_evaluator import _normalize_model_args_for_task


def _get_arg(model_args: str, key: str) -> str | None:
    prefix = f"{key}="
    for part in model_args.split(","):
        part = part.strip()
        if part.startswith(prefix):
            return part[len(prefix) :]
    return None


def test_ruler_default_task_bundle_has_metadata() -> None:
    assert len(RULER_TASKS_DEFAULT_LENGTH) == 13
    for task in RULER_TASKS_DEFAULT_LENGTH:
        assert task.task_kwargs == {"max_seq_lengths": [4096]}


def test_ruler_task_builder_applies_max_seq_lengths() -> None:
    tasks = ruler_tasks_with_max_seq_lengths([4096, 8192])
    assert len(tasks) == 13
    for task in tasks:
        assert task.task_kwargs == {"max_seq_lengths": [4096, 8192]}


def test_convert_to_levanter_task_config_preserves_metadata() -> None:
    tasks = [EvalTaskConfig("niah_single_1", 0, task_kwargs={"max_seq_lengths": [4096, 8192]})]
    converted = convert_to_levanter_task_config(tasks)
    assert converted[0].metadata == {"max_seq_lengths": [4096, 8192]}


def test_resolve_levanter_lm_eval_max_length_respects_task_lengths() -> None:
    evals = [EvalTaskConfig("ruler_vt", 0, task_kwargs={"max_seq_lengths": [4096, 16384]})]
    assert _resolve_lm_eval_max_length(None, evals) == 16384
    assert _resolve_lm_eval_max_length({"max_length": 8192}, evals) == 16384
    assert _resolve_lm_eval_max_length({"max_model_len": 32768}, evals) == 32768


def test_normalize_model_args_for_task_maps_max_model_len_and_task_requirement() -> None:
    no_metadata_task = EvalTaskConfig("ruler_vt", 0)
    args = "model=test,max_model_len=32768,tokenized_requests=False"
    normalized = _normalize_model_args_for_task(args, no_metadata_task)
    assert _get_arg(normalized, "max_length") == "32768"

    long_task = EvalTaskConfig("ruler_vt", 0, task_kwargs={"max_seq_lengths": [4096, 65536]})
    normalized_long = _normalize_model_args_for_task(args, long_task)
    assert _get_arg(normalized_long, "max_length") == "65536"
