# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

"""
Speedruns using the Muon optimizer for various Qwen model sizes (Chinchilla optimal steps)
configs mirroring those in marin/experiments/speedrun/muon_llama_scaling/muon_sweep.py
"""

from fray.cluster import ResourceConfig
from levanter.optim import MuonConfig

from experiments.simple_train_config import SimpleTrainConfig
from experiments.speedrun.scaling_common import (
    LLAMA_SCALING_MODEL_CONFIGS,
    SCALING_PARAM_COUNTS,
    build_runs,
    execute_speedrun,
    get_num_train_steps,
    qwen3_from_llama,
    require_size_value,
)
from marin.speedrun.speedrun import Author, SpeedrunConfig

AUTHOR = Author(
    name="Calvin Xu",
    affiliation="Stanford University",
    url="https://pinlinxu.com",
)


def build_config(size: str) -> tuple[str, SpeedrunConfig]:
    batch_sizes = {
        "130m": 128,
        "300m": 128,
        "520m": 128,
        "1_2b": 256,
    }

    resource_cfgs = {
        "130m": ResourceConfig.with_tpu("v5p-32"),
        "300m": ResourceConfig.with_tpu("v5p-32"),
        "520m": ResourceConfig.with_tpu("v5p-32"),
        "1_2b": ResourceConfig.with_tpu("v5p-32"),
    }

    # Optimizer configs for each size
    muon_configs = {
        "130m": MuonConfig(
            learning_rate=0.016,
            adam_lr=0.0032,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=0,
            momentum=0.95,
            beta1=0.8,
            beta2=0.98,
            epsilon=1e-15,
            muon_epsilon=1e-5,
            max_grad_norm=1,
            lr_schedule="linear",
            decay=0.8,
        ),
        "300m": MuonConfig(
            learning_rate=0.008,
            adam_lr=0.0024,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=0,
            momentum=0.98,
            beta1=0.8,
            beta2=0.98,
            epsilon=1e-15,
            muon_epsilon=1e-5,
            max_grad_norm=1,
            lr_schedule="linear",
            decay=0.8,
        ),
        "520m": MuonConfig(
            learning_rate=0.008,
            adam_lr=0.0024,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=0,
            momentum=0.98,
            beta1=0.8,
            beta2=0.98,
            epsilon=1e-25,
            muon_epsilon=1e-5,
            max_grad_norm=1,
            lr_schedule="linear",
            decay=1,
        ),
        "1_2b": MuonConfig(
            learning_rate=0.004,
            adam_lr=0.0012,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=0,
            momentum=0.98,
            beta1=0.8,
            beta2=0.98,
            epsilon=1e-15,
            muon_epsilon=1e-5,
            max_grad_norm=2,
            lr_schedule="linear",
            decay=1,
        ),
    }

    descriptions = {
        "130m": "Qwen3 ~130M (LLaMA-geometry-matched) with Muon.",
        "300m": "Qwen3 ~300M (LLaMA-geometry-matched) with Muon.",
        "520m": "Qwen3 ~520M (LLaMA-geometry-matched) with Muon.",
        "1_2b": "Qwen3 ~1.2B (LLaMA-geometry-matched) with Muon.",
    }

    run_names = {
        "130m": "qwen3_130m_muon_4096",
        "300m": "qwen3_300m_muon_4096",
        "520m": "qwen3_520m_muon_4096",
        "1_2b": "qwen3_1_2b_muon_4096",
    }

    param_count = require_size_value(size, SCALING_PARAM_COUNTS)
    llama_cfg = require_size_value(size, LLAMA_SCALING_MODEL_CONFIGS)
    batch_size = require_size_value(size, batch_sizes)
    resource_config = require_size_value(size, resource_cfgs)
    muon = require_size_value(size, muon_configs)
    description = require_size_value(size, descriptions)
    run_name = require_size_value(size, run_names)

    # Convert to Qwen3Config and set seq_len=4096 for the sweep
    model_config = qwen3_from_llama(llama_cfg, seq_len_override=4096)
    seq_len = model_config.max_seq_len

    num_train_steps = get_num_train_steps(param_count, batch_size, seq_len)

    train = SimpleTrainConfig(
        resource_config,
        train_batch_size=batch_size,
        num_train_steps=num_train_steps,
        learning_rate=muon.learning_rate,
        optimizer_config=muon,
    )

    cfg = SpeedrunConfig(
        author=AUTHOR,
        description=description,
        model_config=model_config,
        train_config=train,
    )
    return run_name, cfg


if __name__ == "__main__":
    execute_speedrun(
        build_runs(build_config),
        description="Qwen3 Muon speedruns (Chinchilla-optimal tokens, w/ QK-Norm)",
    )
