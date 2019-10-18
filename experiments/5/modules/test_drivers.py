from __future__ import absolute_import, division, print_function

import tensorflow as tf
import tf_agents

from tf_agents.drivers import dynamic_episode_driver, dynamic_step_driver
from tf_agents.metrics import tf_metrics
from tf_agents.replay_buffers import tf_uniform_replay_buffer


def build_buffer(params, train_tf_env, agent):
    buffer = tf_agents.replay_buffers.tf_uniform_replay_buffer.TFUniformReplayBuffer(
        data_spec=agent.collect_data_spec,
        batch_size=train_tf_env.batch_size,  # total "blocks" that can be stored
        max_length=params['replay_buffer_max_length']  # max "frames" in a single "block"
    )

    buffer_iterator = None
    if not params['on_policy']:
        dataset = buffer.as_dataset(
            num_parallel_calls=3,
            sample_batch_size=params['off_policy_train_batch_size'],
            num_steps=2
        ).prefetch(3)
        buffer_iterator = iter(dataset)
    return buffer, buffer_iterator


def build_drivers(params, train_tf_env, eval_tf_env, agent, buffer):
    # DRIVER FOR COLLECTION
    if params['on_policy']:
        collect_driver = tf_agents.drivers.dynamic_episode_driver.DynamicEpisodeDriver(
            train_tf_env,
            agent.collect_policy,
            [buffer.add_batch],
            num_episodes=params['on_policy_collect_episodes'])
    else:
        collect_driver = tf_agents.drivers.dynamic_step_driver.DynamicStepDriver(
            train_tf_env,
            agent.collect_policy,
            [buffer.add_batch],
            num_steps=params['off_policy_collect_steps'])

    # DRIVER FOR EVALUATION
    avg_return_metric = tf_agents.metrics.tf_metrics.AverageReturnMetric()
    avg_return_metric.reset()
    eval_driver = tf_agents.drivers.dynamic_episode_driver.DynamicEpisodeDriver(
        eval_tf_env,
        agent.policy,
        [avg_return_metric.call],
        num_episodes=params['eval_episodes'])
    return collect_driver, eval_driver, avg_return_metric
