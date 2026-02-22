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


def test_compute_num_parameters_includes_final_norm_and_tied_embeddings():
    config = LlamaConfig(
        hidden_dim=4,
        intermediate_dim=8,
        num_heads=2,
        num_kv_heads=1,
        num_layers=1,
        tie_word_embeddings=True,
    )
    vocab_size = 10

    # q(16) + k(8) + v(8) + o(16) + mlp(96) + two layer norms(8) + final norm(4) + embedding(40)
    assert compute_num_parameters(config, vocab_size) == 196


def test_compute_num_parameters_counts_bias_and_qk_norm():
    config = LlamaConfig(
        hidden_dim=8,
        intermediate_dim=16,
        num_heads=2,
        num_kv_heads=1,
        num_layers=1,
        use_bias=True,
        use_qk_norm=True,
    )
    vocab_size = 10

    # attention weights(192) + attention bias(24) + qk norms(16)
    # + mlp weights(384) + mlp bias(40) + two layer norms(32)
    # + final norm(16) + embedding(80) + lm_head(80)
    assert compute_num_parameters(config, vocab_size) == 864
