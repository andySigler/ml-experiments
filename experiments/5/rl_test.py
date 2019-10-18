from __future__ import absolute_import, division, print_function

import numpy as np

import tensorflow as tf
import tf_agents

print('TensorFlow:', tf.__version__)
print('TF-Agents:', tf_agents.__version__)

from modules import test_train, test_utils
from modules.test_agents import agent_lookup


default_params = {
    'env_name': 'CartPole-v1',

    # agent
    'agent': 'ddpg',
    'on_policy': None,  # set automatically while training, by the agent type
    'learning_rate': 1e-4,
    'has_rnn_networks': False,
    'lstm_size': None,

    # OFF Policy specific
    'target_update_tau': 0.1,  # A float scalar in [0, 1]. Default `tau=1.0` means hard update.
    'target_update_period': 1,  # Step interval at which the target networks are updated.

    # REINFORCE specific
    'normalize_returns': True,
    'has_value_network': True,

    # PPO specific
    'normalize_rewards': False,
    'normalize_observations': False,

    # DQN and DDPG specific
#     'td_errors_loss_fn': 'element_wise_squared_loss',
    'td_errors_loss_fn': 'element_wise_huber_loss',

    # DDPG specific
    'ddpg_ou_stddev': 0.2,  # value copied from repo example
    'ddpg_ou_damping': 0.15,  # value copied from repo example

    # actor network
    'actor_fc_layer_params': (256, 256),
    'actor_conv_layer_params': None,
    'rnn_actor_output_fc_layer_params': None,

    # value network
    'value_fc_layer_params': (256, 256),
    'value_conv_layer_params': None,
    'rnn_value_output_fc_layer_params': None,

    # Q network
    'qnet_fc_layer_params': (256, 256),
    'qnet_rnn_output_fc_layer_params': (256, 256),

    # critic network
    'critic_observation_fc_layer_params': (256, 256),
    'critic_observation_conv_layer_params': None,
    'critic_action_fc_layer_params': (256, 256),
    'critic_joint_fc_layer_params': (256, 256),
    'rnn_critic_output_fc_layer_params': (256, 256),

    # buffer
    'replay_buffer_max_length': 1000000,
    'off_policy_train_batch_size': 256,

    # drivers
    'on_policy_collect_episodes': 40,
    'off_policy_collect_steps': 1,
    'eval_episodes': 10,

    # Training loop
    'num_train_loops': 100,
    'off_policy_train_steps': 10000,
    'off_policy_pre_collect': 1000,
    'off_policy_train_iterations_per_loop': 1,
    'max_seq_reward_drops': 15
}

data_filename = './rl_test_data.json'
all_histories = test_utils.load_histories_from_file(
    data_filename, default_params, agent_lookup)

for hist in all_histories:
    print(hist['params'].keys())

exit()

assert len(all_histories) >= 0
param_name = 'agent'
param_values = ['reinforce', 'ppo', 'dqn', 'ddqn', 'ddpg']
for p in param_values:
    temp_params = default_params.copy()
    temp_params.update({param_name: p})
    history = test_train.run_full_sequence(temp_params, agent_lookup)
    test_utils.append_history(all_histories, temp_params, history)
    test_utils.plot_histories(all_histories, param_name)

