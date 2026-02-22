# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

"""Shared helpers for scaling speedrun sweep scripts."""

import dataclasses
from collections.abc import Callable, Mapping, Sequence
from typing import Any, TypeVar

from levanter.models.llama import LlamaConfig
from levanter.models.qwen import Qwen3Config

from experiments.llama import llama_1_4b, llama_150m, llama_300m, llama_600m
from marin.execution.executor import executor_main
from marin.speedrun.speedrun import SpeedrunConfig, default_speedrun

SCALING_SIZES: tuple[str, ...] = ("130m", "300m", "520m", "1_2b")

SCALING_PARAM_COUNTS: dict[str, int] = {
    "130m": 130_000_000,
    "300m": 300_000_000,
    "520m": 520_000_000,
    "1_2b": 1_200_000_000,
}

LLAMA_SCALING_MODEL_CONFIGS: dict[str, LlamaConfig] = {
    "130m": llama_150m,
    "300m": llama_300m,
    "520m": llama_600m,
    "1_2b": llama_1_4b,
}

T = TypeVar("T")


def require_size_value(size: str, values: Mapping[str, T]) -> T:
    """Return a per-size value or raise a clear ValueError."""
    try:
        return values[size]
    except KeyError as exc:
        valid_sizes = ", ".join(sorted(values))
        raise ValueError(f"Unknown size: {size}. Valid sizes: {valid_sizes}") from exc


def get_num_train_steps(param_count: int, batch_size: int, seq_len: int) -> int:
    """Compute Chinchilla-optimal steps (20x-params training tokens)."""
    total_tokens = param_count * 20
    tokens_per_step = batch_size * seq_len
    return total_tokens // tokens_per_step


def with_seq_len(model_config: T, seq_len: int) -> T:
    """Return a model config copy with updated max sequence length."""
    return dataclasses.replace(model_config, max_seq_len=seq_len)


def build_runs(
    build_config: Callable[[str], tuple[str, SpeedrunConfig]], sizes: Sequence[str] = SCALING_SIZES
) -> list[tuple[str, SpeedrunConfig]]:
    return [build_config(size) for size in sizes]


def execute_speedrun(runs: Sequence[tuple[str, SpeedrunConfig]], *, description: str) -> None:
    """Print run metadata, build steps, and execute."""
    steps = []
    for run_name, cfg in runs:
        cfg.print_run_info()
        steps.extend(default_speedrun(run_name, cfg))

    executor_main(steps=steps, description=description)


def qwen3_from_llama(
    llama_cfg: LlamaConfig,
    *,
    seq_len_override: int | None = None,
    hybrid_norm: bool | None = None,
) -> Qwen3Config:
    """Build a Qwen3 config with dimensions copied from a LLaMA config."""
    qwen_kwargs: dict[str, Any] = {
        "max_seq_len": seq_len_override if seq_len_override is not None else llama_cfg.max_seq_len,
        "hidden_dim": llama_cfg.hidden_dim,
        "intermediate_dim": llama_cfg.intermediate_dim,
        "num_layers": llama_cfg.num_layers,
        "num_heads": llama_cfg.num_heads,
        "num_kv_heads": llama_cfg.num_kv_heads,
        "head_dim": getattr(llama_cfg, "head_dim", None),
        "use_bias": getattr(llama_cfg, "use_bias", False),
        "rope": llama_cfg.rope,
        "activation_function": llama_cfg.activation_function,
        "initializer_range": llama_cfg.initializer_range,
        "layer_norm_epsilon": llama_cfg.layer_norm_epsilon,
        "tie_word_embeddings": llama_cfg.tie_word_embeddings,
        "upcast_attn": llama_cfg.upcast_attn,
        "attn_backend": llama_cfg.attn_backend,
        "flash_attention_block_size": llama_cfg.flash_attention_block_size,
        "scan_layers": getattr(llama_cfg, "scan_layers", False),
        "gradient_checkpointing": getattr(llama_cfg, "gradient_checkpointing", False),
    }
    if hybrid_norm is not None:
        qwen_kwargs["hybrid_norm"] = hybrid_norm
    return Qwen3Config(**qwen_kwargs)
