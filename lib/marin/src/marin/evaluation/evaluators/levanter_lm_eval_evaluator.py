# Copyright 2025 The Marin Authors
# SPDX-License-Identifier: Apache-2.0

import dataclasses
import json
import logging
import os

import fsspec
import jmp
import levanter
import levanter.eval_harness as eval_harness
from levanter.compat.hf_checkpoints import HFCheckpointConverter
from levanter.distributed import RayConfig
from levanter.tracker.wandb import WandbConfig
from levanter.trainer import TrainerConfig

from experiments.evals.task_configs import convert_to_levanter_task_config
from marin.evaluation.evaluation_config import EvalTaskConfig
from marin.evaluation.evaluators.evaluator import ModelConfig
from marin.evaluation.evaluators.lm_eval_length_utils import resolve_lm_eval_max_length
from marin.evaluation.evaluators.levanter_tpu_evaluator import LevanterTpuEvaluator
from fray.v1.cluster.ray.deps import build_runtime_env_for_packages

logger = logging.getLogger(__name__)


class LevanterLmEvalEvaluator(LevanterTpuEvaluator):
    """For `Evaluator`s that runs inference with Levanter's Lm Eval Harness on TPUs."""

    def get_runtime_env(self) -> dict:
        """
        Returns the runtime environment to run the evaluator on the Ray cluster.
        """
        return build_runtime_env_for_packages(
            extra=["eval", "tpu"],
            pip_packages=["statsmodels==0.14.4"],
            env_vars={
                "TOKENIZERS_PARALLELISM": "false",
                "HF_DATASETS_TRUST_REMOTE_CODE": "1",
                "HF_ALLOW_CODE_EVAL": "1",
            },
        )

    def evaluate(
        self,
        model: ModelConfig,
        evals: list[EvalTaskConfig],
        output_path: str,
        max_eval_instances: int | None = None,
        wandb_tags: list[str] | None = None,
    ) -> None:
        """
        Runs Levanter's lm-eval harness on the specified model and set of tasks.

        Args:
            model (ModelConfig): The model configuration of the model we want to evaluate
            evals (List[EvalTaskConfig]): The list of evaluations to run.
            output_path (str): The path to save the evaluation results.
            max_eval_instances (int | None): The maximum number of evaluation instances to run.
            wandb_tags (list[str] | None): The tags to add to the wandb run.
        """
        # Eval Harness code: https://github.com/stanford-crfm/levanter/blob/main/src/levanter/eval_harness.py
        # Run the harness with the model and the specified evals

        try:
            model_name_or_path: str = self.model_name_or_path(model)
            name = model.name + "_lmeval_" + "-".join([eval_task.name for eval_task in evals])
            logger.info(f"WandB Run Name: {name}")
            logger.info(f"Running eval harness on model: {model_name_or_path}")
            trainer_config = TrainerConfig(
                tracker=WandbConfig(project="marin", tags=wandb_tags, name=name),
                mp=jmp.get_policy("p=f32,c=bfloat16"),
                per_device_eval_parallelism=1,
                ray=RayConfig(auto_start_cluster=False),
            )

            model_config = HFCheckpointConverter.from_hf(model_name_or_path).LevConfigClass()

            # convert to the config that Levanter's eval_harness expects
            tasks = convert_to_levanter_task_config(evals)
            logger.info(f"Tasks: {tasks}")
            max_length = resolve_lm_eval_max_length(model.engine_kwargs, evals)
            logger.info("Resolved lm-eval max_length=%s", max_length)

            model_path = model_name_or_path

            logger.info(f"Model path: {model_path}")
            logger.info(f"Model name: {model.name}")
            logger.info(f"model_name_or_path: {model_name_or_path}")

            pretrained_model_name = _resolve_hf_model_name(model_path=model_path, model_name=model.name)
            if pretrained_model_name:
                logger.info(f"Resolved HF model name for task metadata: {pretrained_model_name}")

            eval_config = eval_harness.EvalHarnessMainConfig(
                eval_harness=eval_harness.LmEvalHarnessConfig(
                    task_spec=tasks,
                    max_examples=max_eval_instances,
                    log_samples=False,
                    max_length=max_length,
                    apply_chat_template=model.apply_chat_template,
                    confirm_run_unsafe_code=True,
                    sample_logging=eval_harness.SampleLoggingConfig(max_samples_per_benchmark=20),
                ),
                tokenizer=model_path,
                checkpoint_path=model_path,
                checkpoint_is_hf=True,
                trainer=trainer_config,
                model=model_config,
                pretrained_model_name=pretrained_model_name,
            )

            results = eval_harness.run_eval_harness_main(eval_config)

            try:
                # add a results.json to output path
                output_path = os.path.join(output_path, "results.json")

                logger.info(f"Uploading results to GCS: {output_path}")

                # write output JSON directly to output_path on GCS
                fs = fsspec.filesystem("gcs")
                with fs.open(output_path, "w") as f:
                    json.dump(results, f, indent=2, default=_json_default)

                levanter.tracker.current_tracker().finish()
                logger.info("Upload completed successfully.")

            except Exception as upload_error:
                logger.info(f"Failed to upload results to GCS: {upload_error}")

        except Exception as e:
            logger.error(f"Error running eval harness: {e}")
            raise e


def _resolve_hf_model_name(model_path: str, model_name: str) -> str | None:
    model_name_from_config = _read_hf_model_name_from_config(model_path)
    if model_name_from_config is not None:
        return model_name_from_config

    return _infer_hf_model_name_from_identifier(model_name) or _infer_hf_model_name_from_identifier(model_path)


def _read_hf_model_name_from_config(model_path: str) -> str | None:
    """Read the original HF repo ID from config.json at the model path."""
    config_path = os.path.join(model_path, "config.json")
    try:
        with fsspec.open(config_path, "r") as f:
            hf_config = json.load(f)
        name = hf_config.get("_name_or_path")
        if name and not name.startswith(("gs://", "s3://", "/", ".")):
            return name
    except Exception:
        logger.debug("Could not read HF model name from %s", config_path, exc_info=True)
    return None


def _infer_hf_model_name_from_identifier(identifier: str) -> str | None:
    component = identifier.rstrip("/").split("/")[-1]
    if "/" in identifier and not identifier.startswith(("gs://", "s3://", "/", ".")):
        return identifier

    pieces = component.split("--")
    if len(pieces) < 3:
        return None

    maybe_revision = pieces[-1]
    if len(maybe_revision) < 6 or any(c not in "0123456789abcdef" for c in maybe_revision.lower()):
        return None

    org = pieces[0]
    repo = "--".join(pieces[1:-1])
    if not org or not repo:
        return None
    return f"{org}/{repo}"


def _json_default(value):
    """
    Provide a best-effort JSON serialization for objects returned by the eval harness.
    """
    if dataclasses.is_dataclass(value):
        return dataclasses.asdict(value)

    if isinstance(value, set):
        return list(value)

    if hasattr(value, "to_dict") and callable(value.to_dict):
        try:
            return value.to_dict()
        except Exception:
            pass

    return repr(value)
