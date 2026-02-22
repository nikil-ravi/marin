# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

import logging

from marin.evaluation.evaluation_config import EvalTaskConfig

logger = logging.getLogger(__name__)
DEFAULT_LM_EVAL_MAX_LENGTH = 4096


def _split_model_args(model_args: str) -> list[str]:
    return [part.strip() for part in model_args.split(",") if part.strip()]


def _get_model_arg(model_args: str, key: str) -> str | None:
    prefix = f"{key}="
    for part in _split_model_args(model_args):
        if part.startswith(prefix):
            return part[len(prefix) :]
    return None


def _set_model_arg(model_args: str, key: str, value: object) -> str:
    parts = _split_model_args(model_args)
    replacement = f"{key}={value}"
    for idx, part in enumerate(parts):
        if part.startswith(f"{key}="):
            parts[idx] = replacement
            break
    else:
        parts.append(replacement)
    return ",".join(parts)


def _coerce_positive_int(value: object) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    if parsed <= 0:
        return None
    return parsed


def task_max_seq_length(eval_task: EvalTaskConfig) -> int | None:
    task_kwargs = eval_task.task_kwargs or {}
    max_seq_lengths = task_kwargs.get("max_seq_lengths")
    if max_seq_lengths is None:
        return None
    if not isinstance(max_seq_lengths, list | tuple):
        logger.warning("Ignoring non-list max_seq_lengths for %s: %r", eval_task.name, max_seq_lengths)
        return None

    max_length = None
    for seq_length in max_seq_lengths:
        parsed = _coerce_positive_int(seq_length)
        if parsed is None:
            logger.warning("Ignoring invalid max_seq_lengths entry for %s: %r", eval_task.name, seq_length)
            continue
        max_length = parsed if max_length is None else max(max_length, parsed)
    return max_length


def max_task_seq_length(evals: list[EvalTaskConfig]) -> int | None:
    max_length = None
    for eval_task in evals:
        task_length = task_max_seq_length(eval_task)
        if task_length is None:
            continue
        max_length = task_length if max_length is None else max(max_length, task_length)
    return max_length


def resolve_lm_eval_max_length(
    engine_kwargs: dict | None,
    evals: list[EvalTaskConfig],
    default_max_length: int = DEFAULT_LM_EVAL_MAX_LENGTH,
) -> int:
    engine_kwargs = engine_kwargs or {}
    configured_max_length = _coerce_positive_int(engine_kwargs.get("max_length"))
    if configured_max_length is None:
        configured_max_length = _coerce_positive_int(engine_kwargs.get("max_model_len"))

    task_max_length = max_task_seq_length(evals)

    if configured_max_length is None and task_max_length is None:
        return default_max_length
    if configured_max_length is None:
        assert task_max_length is not None
        return task_max_length
    if task_max_length is None:
        return configured_max_length
    return max(configured_max_length, task_max_length)


def normalize_model_args_for_task(base_model_args: str, eval_task: EvalTaskConfig) -> str:
    model_args = base_model_args
    max_length = _coerce_positive_int(_get_model_arg(model_args, "max_length"))
    max_model_len = _coerce_positive_int(_get_model_arg(model_args, "max_model_len"))
    required_task_length = task_max_seq_length(eval_task)

    if max_length is None and max_model_len is not None:
        model_args = _set_model_arg(model_args, "max_length", max_model_len)
        max_length = max_model_len

    if required_task_length is not None and (max_length is None or max_length < required_task_length):
        model_args = _set_model_arg(model_args, "max_length", required_task_length)

    return model_args
