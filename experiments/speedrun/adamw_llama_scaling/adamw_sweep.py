# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

"""Speedruns using the AdamW optimizer for various Llama model sizes (Chinchilla optimal steps).

Optimizer configs were searched & provided by Kaiyue Wen in https://wandb.ai/marin-community/marin/reports/Fantastic-Optimizers-and-Where-to-Find-Them--VmlldzoxMjgzMzQ2NQ
"""

from fray.cluster import ResourceConfig
from levanter.optim import AdamConfig

from experiments.simple_train_config import SimpleTrainConfig
from experiments.speedrun.scaling_common import (
    LLAMA_SCALING_MODEL_CONFIGS,
    SCALING_PARAM_COUNTS,
    build_runs,
    execute_speedrun,
    get_num_train_steps,
    require_size_value,
    with_seq_len,
)
from marin.speedrun.speedrun import Author, SpeedrunConfig

AUTHOR = Author(name="William Held", affiliation="Georgia Tech", url="https://WilliamHeld.com")


def build_config(size: str) -> tuple[str, SpeedrunConfig]:
    # Training batch sizes
    batch_sizes = {
        "130m": 128,
        "300m": 128,
        "520m": 256,
        "1_2b": 256,
    }

    # Resource configs
    resource_cfgs = {
        "130m": ResourceConfig.with_tpu("v5p-32"),
        "300m": ResourceConfig.with_tpu("v5p-32"),
        "520m": ResourceConfig.with_tpu("v5p-32"),
        "1_2b": ResourceConfig.with_tpu("v5p-32"),
    }

    # AdamW optimizer configs for each size
    adam_configs = {
        "130m": AdamConfig(
            learning_rate=0.008,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=2000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-20,
            max_grad_norm=1,
            nesterov=False,
        ),
        "300m": AdamConfig(
            learning_rate=0.008,
            weight_decay=0.1,
            min_lr_ratio=0,
            warmup=2000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-10,
            max_grad_norm=1,
            nesterov=False,
        ),
        "520m": AdamConfig(
            learning_rate=0.004,
            weight_decay=0.2,
            min_lr_ratio=0,
            warmup=1000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-10,
            max_grad_norm=1,
            nesterov=False,
        ),
        "1_2b": AdamConfig(
            learning_rate=0.002,
            weight_decay=0.2,
            min_lr_ratio=0,
            warmup=1000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-25,
            max_grad_norm=2,
            nesterov=False,
        ),
    }

    # Descriptions
    descriptions = {
        "130m": "130M parameter model trained with the AdamW optimizer.",
        "300m": "300M parameter model trained with the AdamW optimizer.",
        "520m": "520M parameter model trained with the AdamW optimizer.",
        "1_2b": "1.2B parameter model trained with the AdamW optimizer.",
    }

    # Names for the runs
    run_names = {
        "130m": "llama_130m_adamw_4096",
        "300m": "llama_300m_adamw_4096",
        "520m": "llama_520m_adamw_4096",
        "1_2b": "llama_1_2b_adamw_fix_4096",
    }

    param_count = require_size_value(size, SCALING_PARAM_COUNTS)
    batch_size = require_size_value(size, batch_sizes)
    model_config = with_seq_len(require_size_value(size, LLAMA_SCALING_MODEL_CONFIGS), seq_len=4096)
    train_seq_len = model_config.max_seq_len
    resource_config = require_size_value(size, resource_cfgs)
    adam = require_size_value(size, adam_configs)
    description = require_size_value(size, descriptions)
    run_name = require_size_value(size, run_names)

    num_train_steps = get_num_train_steps(param_count, batch_size, train_seq_len)

    train = SimpleTrainConfig(
        resource_config,
        train_batch_size=batch_size,
        num_train_steps=num_train_steps,
        learning_rate=adam.learning_rate,
        optimizer_config=adam,
    )
    cfg = SpeedrunConfig(
        author=AUTHOR,
        description=description,
        model_config=model_config,
        train_config=train,
    )
    return run_name, cfg


if __name__ == "__main__":
    execute_speedrun(build_runs(build_config), description="AdamW speedruns (Chinchilla optimal)")
