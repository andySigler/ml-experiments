from . import test_agents
from . import test_environments
from . import test_drivers

import tensorflow as tf
import tf_agents


def train(params, agent, data_buffer, buffer_iterator, collect_driver, eval_driver, avg_return_metric):
    max_return = None
    num_seq_reward_drops = 0
    history = []
    num_iterations = params['num_train_loops']
    log_every = 1
    if not params['on_policy']:
        num_iterations = params['off_policy_train_steps']
        log_every = int(num_iterations / params['num_train_loops'])
        print('Pre-collecting')
        for _ in range(params['off_policy_pre_collect']):
            collect_driver.run()
    for i in range(num_iterations):
        if i % log_every == 0:
            print('Iteration:', i + 1, '/', num_iterations)
            print('\tCollecting')
        collect_driver.run()

        if i % log_every == 0:
            print('\tTraining')
        if params['on_policy']:
            agent.train(data_buffer.gather_all())
            data_buffer.clear()
        else:
            for _ in range(params['off_policy_train_iterations_per_loop']):
                agent.train(next(buffer_iterator)[0])

        if i % log_every == 0:
            avg_return_metric.reset()
            eval_driver.run()
            ret_val = float(avg_return_metric.result().numpy())
            history.append(ret_val)
            avg_return_metric.reset()
            print('\tAverage Reward:', ret_val)

            if max_return is None or max_return < ret_val:
                max_return = ret_val
                num_seq_reward_drops = 0
            elif ret_val <= max_return:
                num_seq_reward_drops += 1
                if params['max_seq_reward_drops']:
                    if num_seq_reward_drops >= params['max_seq_reward_drops']:
                        break
    return history


def run_full_sequence(params, agent_lookup):
    params['on_policy'] = agent_lookup[params['agent']]['on_policy']
    params['continuous_action'] = agent_lookup[params['agent']].get('continuous_action', False)
    params['discrete_action'] = agent_lookup[params['agent']].get('discrete_action', False)
    tf.keras.backend.clear_session()
    (train_py_env, train_tf_env), (eval_py_env, eval_tf_env) = test_environments.create_envs(params)
    agent = agent_lookup[params['agent']]['create'](params, train_tf_env)
    data_buffer, buffer_iterator = test_drivers.build_buffer(params, train_tf_env, agent)
    collect_driver, eval_driver, avg_return_metric = test_drivers.build_drivers(
        params, train_tf_env, eval_tf_env, agent, data_buffer)
    try:
        history = train(
            params, agent, data_buffer, buffer_iterator, collect_driver, eval_driver, avg_return_metric)
    except Exception as e:
        raise e
    finally:
        data_buffer.clear()
    return history

