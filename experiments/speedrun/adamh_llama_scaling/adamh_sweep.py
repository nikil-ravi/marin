# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

"""Speedruns using the AdamH optimizer for various Llama model sizes (Chinchilla optimal steps)."""

import logging
import os

from fray.cluster import ResourceConfig
from levanter.optim import AdamHConfig

from experiments.simple_train_config import SimpleTrainConfig
from experiments.speedrun.adamh_llama_scaling.llama_with_hybrid_norm import (
    llama_1_4b_all_norm,
    llama_150m_all_norm,
    llama_300m_all_norm,
    llama_600m_all_norm,
)
from experiments.speedrun.scaling_common import (
    SCALING_PARAM_COUNTS,
    build_runs,
    execute_speedrun,
    get_num_train_steps,
    require_size_value,
    with_seq_len,
)
from marin.speedrun.speedrun import Author, SpeedrunConfig

AUTHOR = Author(name="Kaiyue Wen", affiliation="Stanford University", url="https://whenwen.github.io")

logger = logging.getLogger("ray")


def build_config(size: str) -> tuple[str, SpeedrunConfig]:
    # Model configs
    model_cfgs = {
        "130m": llama_150m_all_norm,
        "300m": llama_300m_all_norm,
        "520m": llama_600m_all_norm,
        "1_2b": llama_1_4b_all_norm,
    }

    # Training batch sizes
    batch_sizes = {
        "130m": 128,
        "300m": 128,
        "520m": 256,
        "1_2b": 256,
    }

    # Resource configs
    resource_cfgs = {
        "130m": ResourceConfig.with_tpu("v5litepod-64"),
        "300m": ResourceConfig.with_tpu("v5litepod-64"),
        "520m": ResourceConfig.with_tpu("v5litepod-64"),
        "1_2b": ResourceConfig.with_tpu("v5litepod-64"),
    }

    # AdamH optimizer configs for each size
    adam_configs = {
        "130m": AdamHConfig(
            learning_rate=0.02,
            adam_lr=0.008,
            min_lr_ratio=0,
            warmup=1000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-20,
            max_grad_norm=1,
            nesterov=False,
        ),
        "300m": AdamHConfig(
            learning_rate=0.02,
            adam_lr=0.008,
            min_lr_ratio=0,
            warmup=1000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-10,
            max_grad_norm=1,
            nesterov=False,
        ),
        "520m": AdamHConfig(
            learning_rate=0.02,
            adam_lr=0.004,
            min_lr_ratio=0,
            warmup=1000,
            beta1=0.9,
            beta2=0.98,
            epsilon=1e-10,
            max_grad_norm=1,
            nesterov=False,
        ),
        "1_2b": AdamHConfig(
            learning_rate=0.015,
            adam_lr=0.0015,
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
    format_str = (
        "{size} parameter model (basically fully scale invariant) "
        "trained with the AdamH optimizer to maintain constant norm."
    )
    descriptions = {
        "130m": format_str.format(size="130M"),
        "300m": format_str.format(size="300M"),
        "520m": format_str.format(size="520M"),
        "1_2b": format_str.format(size="1.2B"),
    }

    # Names for the runs
    run_names = {
        "130m": "llama_130m_adamh_lr0.02_adam_lr0.008_warmup1000_qk",
        "300m": "llama_300m_adamh_lr0.02_adam_lr0.008_warmup1000_qk",
        "520m": "llama_520m_adamh_lr0.02_adam_lr0.004_warmup1000_qk",
        "1_2b": "llama_1_2b_adamh_lr0.015_adam_lr0.0015_warmup1000_qk",
    }

    param_count = require_size_value(size, SCALING_PARAM_COUNTS)
    batch_size = require_size_value(size, batch_sizes)
    model_config = with_seq_len(require_size_value(size, model_cfgs), seq_len=4096)
    max_seq_len = model_config.max_seq_len
    resource_config = require_size_value(size, resource_cfgs)
    adam = require_size_value(size, adam_configs)
    description = require_size_value(size, descriptions)
    run_name = require_size_value(size, run_names)

    num_train_steps = get_num_train_steps(param_count, batch_size, max_seq_len)

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


def main():
    if os.getenv("CI", None) is not None:
        logger.info("Skipping experiment execution on CI environment, needs HF access.")
        return

    execute_speedrun(build_runs(build_config), description="AdamH speedruns (Chinchilla optimal)")


if __name__ == "__main__":
    main()
