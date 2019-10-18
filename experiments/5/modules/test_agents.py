from __future__ import absolute_import, division, print_function

import tensorflow as tf
import tf_agents

from tf_agents.agents.ddpg import actor_network, actor_rnn_network
from tf_agents.agents.ddpg import critic_network, critic_rnn_network
from tf_agents.agents.ddpg import ddpg_agent
from tf_agents.agents.dqn import dqn_agent
from tf_agents.agents.reinforce import reinforce_agent
from tf_agents.agents.ppo import ppo_agent
from tf_agents.networks import actor_distribution_network, value_network
from tf_agents.networks import actor_distribution_rnn_network, value_rnn_network
from tf_agents.networks import q_network
from tf_agents.utils import common


def create_agent_reinforce(params, train_tf_env):

    actor_network = tf_agents.networks.actor_distribution_network.ActorDistributionNetwork(
        input_tensor_spec=train_tf_env.observation_spec(),
        output_tensor_spec=train_tf_env.action_spec(),
        fc_layer_params=params['actor_fc_layer_params'],
        conv_layer_params=params['actor_conv_layer_params']
    )

    value_network = None
    if params['has_value_network']:
        value_network = tf_agents.networks.value_network.ValueNetwork(
            input_tensor_spec=train_tf_env.observation_spec(),
            fc_layer_params=params['value_fc_layer_params'],
            conv_layer_params=params['value_conv_layer_params']
        )

    agent = tf_agents.agents.reinforce.reinforce_agent.ReinforceAgent(
        train_tf_env.time_step_spec(),
        train_tf_env.action_spec(),
        actor_network=actor_network,
        value_network=value_network,
        optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        normalize_returns=params['normalize_returns'],
        train_step_counter=tf.Variable(0)
    )

    agent.initialize()
    return agent


def create_agent_ppo(params, train_tf_env):
    value_network = None
    if params['has_rnn_networks']:
        actor_network = tf_agents.networks.actor_distribution_rnn_network.ActorDistributionRnnNetwork(
            input_tensor_spec=train_tf_env.observation_spec(),
            output_tensor_spec=train_tf_env.action_spec(),
            input_fc_layer_params=params['actor_fc_layer_params'],
            conv_layer_params=params['actor_conv_layer_params'],
            lstm_size=params['lstm_size'],
            output_fc_layer_params=params['rnn_actor_output_fc_layer_params']
        )
        value_network = tf_agents.networks.value_rnn_network.ValueRnnNetwork(
            input_tensor_spec=train_tf_env.observation_spec(),
            input_fc_layer_params=params['value_fc_layer_params'],
            conv_layer_params=params['value_conv_layer_params'],
            lstm_size=params['lstm_size'],
            output_fc_layer_params=params['rnn_value_output_fc_layer_params']
        )
    else:
        actor_network = tf_agents.networks.actor_distribution_network.ActorDistributionNetwork(
            input_tensor_spec=train_tf_env.observation_spec(),
            output_tensor_spec=train_tf_env.action_spec(),
            fc_layer_params=params['actor_fc_layer_params'],
            conv_layer_params=params['actor_conv_layer_params']
        )
        value_network = tf_agents.networks.value_network.ValueNetwork(
            input_tensor_spec=train_tf_env.observation_spec(),
            fc_layer_params=params['value_fc_layer_params'],
            conv_layer_params=params['value_conv_layer_params']
        )

    agent = ppo_agent.PPOAgent(
        train_tf_env.time_step_spec(),
        train_tf_env.action_spec(),
        optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        actor_net=actor_network,
        value_net=value_network
    )

    agent.initialize()
    return agent


def create_agent_dqn(params, train_tf_env):
    if params['has_rnn_networks']:
        q_net = q_rnn_network.QRnnNetwork(
            train_tf_env.observation_spec(),
            train_tf_env.action_spec(),
            input_fc_layer_params=params['qnet_fc_layer_params'],
            lstm_size=params['lstm_size'],
            output_fc_layer_params=params['qnet_rnn_output_fc_layer_params'])
    else:
        q_net = q_network.QNetwork(
            train_tf_env.observation_spec(),
            train_tf_env.action_spec(),
            fc_layer_params=params['qnet_fc_layer_params'])

    agent = dqn_agent.DqnAgent(
        train_tf_env.time_step_spec(),
        train_tf_env.action_spec(),
        q_network=q_net,
        optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        td_errors_loss_fn=getattr(common, params['td_errors_loss_fn'])
    )
    agent.initialize()
    return agent


def create_agent_ddqn(params, train_tf_env):
    if params['has_rnn_networks']:
        q_net = q_rnn_network.QRnnNetwork(
            train_tf_env.observation_spec(),
            train_tf_env.action_spec(),
            input_fc_layer_params=params['qnet_fc_layer_params'],
            lstm_size=params['lstm_size'],
            output_fc_layer_params=params['qnet_rnn_output_fc_layer_params'])
    else:
        q_net = q_network.QNetwork(
            train_tf_env.observation_spec(),
            train_tf_env.action_spec(),
            fc_layer_params=params['qnet_fc_layer_params'])

    agent = dqn_agent.DdqnAgent(
        train_tf_env.time_step_spec(),
        train_tf_env.action_spec(),
        q_network=q_net,
        optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        td_errors_loss_fn=getattr(common, params['td_errors_loss_fn'])
    )
    agent.initialize()
    return agent


def create_agent_ddpg(params, train_tf_env):
    if params['has_rnn_networks']:
        actor_network = tf_agents.agents.ddpg.actor_rnn_network.ActorRNNNetwork(
            train_tf_env.time_step_spec().observation,
            train_tf_env.action_spec(),
            fc_layer_params=params['actor_fc_layer_params'],
            conv_layer_params=params['actor_conv_layer_params'],
            output_fc_layer_params=params['rnn_actor_output_fc_layer_params'],
            lstm_size=params['lstm_size']
        )
        critic_network = tf_agents.agents.ddpg.critic_rnn_network.CriticRNNNetwork(
            (train_tf_env.time_step_spec().observation, train_tf_env.action_spec()),
            observation_fc_layer_params=params['critic_observation_fc_layer_params'],
            observation_conv_layer_params=params['critic_observation_conv_layer_params'],
            action_fc_layer_params=params['critic_action_fc_layer_params'],
            joint_fc_layer_params=params['critic_joint_fc_layer_params'],
            output_fc_layer_params=params['rnn_critic_output_fc_layer_params'],
            lstm_size=params['lstm_size']
        )
    else:
        actor_network = tf_agents.agents.ddpg.actor_network.ActorNetwork(
            train_tf_env.time_step_spec().observation,
            train_tf_env.action_spec(),
            fc_layer_params=params['actor_fc_layer_params'],
            conv_layer_params=params['actor_conv_layer_params']
        )
        critic_network = tf_agents.agents.ddpg.critic_network.CriticNetwork(
            (train_tf_env.time_step_spec().observation, train_tf_env.action_spec()),
            observation_fc_layer_params=params['critic_observation_fc_layer_params'],
            observation_conv_layer_params=params['critic_observation_conv_layer_params'],
            action_fc_layer_params=params['critic_action_fc_layer_params'],
            joint_fc_layer_params=params['critic_joint_fc_layer_params'],
        )

    agent = ddpg_agent.DdpgAgent(
        train_tf_env.time_step_spec(),
        train_tf_env.action_spec(),
        actor_network=actor_network,
        critic_network=critic_network,
        actor_optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        critic_optimizer=tf.compat.v1.train.AdamOptimizer(learning_rate=params['learning_rate']),
        td_errors_loss_fn=getattr(common, params['td_errors_loss_fn']),
        ou_stddev=params['ddpg_ou_stddev'],
        ou_damping=params['ddpg_ou_damping']
    )
    agent.initialize()
    return agent

agent_lookup = {
    'reinforce': {
        'create': create_agent_reinforce,
        'on_policy': True
    },
    'ppo': {
        'create': create_agent_ppo,
        'on_policy': True
    },
    'dqn': {
        'create': create_agent_dqn,
        'on_policy': False,
        'discrete_action': True
    },
    'ddqn': {
        'create': create_agent_ddqn,
        'on_policy': False,
        'discrete_action': True
    },
    'ddpg': {
        'create': create_agent_ddpg,
        'on_policy': False,
        'continuous_action': True
    }
}
