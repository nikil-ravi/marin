import pytest

from experiments.llama import compute_num_parameters
from levanter.models.llama import LlamaConfig


@pytest.mark.parametrize(
    "config_kwargs",
    [
        dict(hidden_dim=256, intermediate_dim=896, num_heads=4, num_kv_heads=4, num_layers=8),
        dict(
            hidden_dim=512,
            intermediate_dim=1792,
            num_heads=8,
            num_kv_heads=4,
            num_layers=6,
            tie_word_embeddings=True,
        ),
        dict(
            hidden_dim=768,
            intermediate_dim=3072,
            num_heads=12,
            num_kv_heads=3,
            num_layers=10,
            head_dim=80,
            hybrid_norm=True,
            input_embedding_norm=True,
        ),
    ],
)
def test_compute_num_parameters_matches_llama_config_total_trainable_params(config_kwargs):
    config = LlamaConfig(**config_kwargs)
    vocab_size = 128_256
    assert compute_num_parameters(config, vocab_size) == int(config.total_trainable_params(vocab_size))
