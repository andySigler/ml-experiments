from __future__ import absolute_import, division, print_function

import base64
import imageio
import numpy as np
import PIL.Image

from gym import envs
import tensorflow as tf
import tf_agents

from tf_agents.environments import suite_gym, suite_pybullet
from tf_agents.environments import tf_py_environment, wrappers
from tf_agents.specs import array_spec


all_env_ids = [e.id for e in list(envs.registry.all())]
print(len(all_env_ids), 'Gym Environments Found')

smaller_envs = [
    'CartPole-v0',
    'CartPole-v1',
    'MountainCar-v0',
    'MountainCarContinuous-v0',
    'Pendulum-v0',
    'Acrobot-v1'
]


class ActionContinuousWrapper(tf_agents.environments.wrappers.PyEnvironmentBaseWrapper):
    """Wraps an environment with discrete actions and makes them continuous."""
    def __init__(self, env):
        super(ActionContinuousWrapper, self).__init__(env)
        self._old_spec = env.action_spec()
        self._continuous_action_spec = tf_agents.specs.array_spec.BoundedArraySpec(
            shape=self._old_spec.shape,
            dtype=np.float32,
            minimum=float(self._old_spec.minimum),
            maximum=float(self._old_spec.maximum),
            name=self._old_spec.name
        )
        num_actions = 1 + (self._old_spec.maximum - self._old_spec.minimum)
        self._action_space = np.linspace(
            self._continuous_action_spec.minimum,
            self._continuous_action_spec.maximum,
            num=num_actions,
            endpoint=False
        )
        self._reverse_action_lookup_indices = list(
            range(len(self._action_space))
        )[::-1]

    def _continuous_to_discrete_value(self, action_value):
        for i in self._reverse_action_lookup_indices:
            if action_value >= self._action_space[i]:
                return int(self._old_spec.minimum + i)

    def _step(self, action):
        discrete_actions = np.array([
            self._continuous_to_discrete_value(a)
            for a in action.flatten()
        ], dtype=np.int32)
        return self._env.step(np.reshape(discrete_actions, action.shape))

    def action_spec(self):
        return self._continuous_action_spec


def create_envs(params):
    train_py_env = tf_agents.environments.suite_gym.load(params['env_name'])
    action_dtype = train_py_env.action_spec().dtype
    if params['continuous_action'] and 'int' in str(action_dtype):
        train_py_env = ActionContinuousWrapper(train_py_env)
    elif params['discrete_action'] and 'float' in str(action_dtype):
        train_py_env = ActionDiscretizeWrapper(train_py_env)
    train_tf_env = tf_agents.environments.tf_py_environment.TFPyEnvironment(
        train_py_env)

    eval_py_env = tf_agents.environments.suite_gym.load(params['env_name'])
    if params['continuous_action'] and 'int' in str(action_dtype):
        eval_py_env = ActionContinuousWrapper(eval_py_env)
    elif params['discrete_action'] and 'float' in str(action_dtype):
        train_py_env = ActionDiscretizeWrapper(train_py_env)
    eval_tf_env = tf_agents.environments.tf_py_environment.TFPyEnvironment(
        eval_py_env)

    train_py_env.reset()
#     action_spec = train_py_env.action_spec()
#     obs_spec = train_py_env.observation_spec()
#     print(params['env_name'], '  -  Index:', r_idx)
#     print(action_spec.shape, '->', obs_spec.shape)
#     print(action_spec.dtype, '->', obs_spec.dtype)
#     plt.imshow(PIL.Image.fromarray(train_py_env.render()))
#     plt.show()
    return (train_py_env, train_tf_env), (eval_py_env, eval_tf_env)


def create_env_video(agent, py_env, tf_env, num_episodes=3):
    video_filename = 'imageio.mp4'
    with imageio.get_writer(video_filename, fps=60) as video:
        for _ in range(num_episodes):
            time_step = tf_env.reset()
            video.append_data(py_env.render())
            while not time_step.is_last():
                action_step = agent.policy.action(time_step)
                time_step = tf_env.step(action_step.action)
                video.append_data(py_env.render())

