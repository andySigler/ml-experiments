import json
import matplotlib.pyplot as plt
import os


def plot_histories(all_histories, label=None):
    print('Plotting:', label)
    for hist in all_histories:
        param_label = None
        if label:
            param_label = hist['params'][label]
        plt.plot(
            range(len(hist['returns'])),
            hist['returns'],
            label=param_label
        )
    if label:
        plt.legend()
    plt.show()


def load_histories_from_file(filename, default_params, agent_lookup):
    new_data = []
    with open(filename, 'r') as f:
        data_list = json.load(f)
        for hist in data_list:
            # in case a parameter isn't there, set it to it's default value
            for key, val in default_params.items():
                if key == 'on_policy' :
                    val = agent_lookup[hist['params']['agent']]['on_policy']
                if key not in hist['params']:
                    hist['params'][key] = val
            new_data.append(hist)
    return new_data


def save_histories_to_file(filename, data):
    with open(filename, 'w') as f:
        f.write(json.dumps(data))


def append_history(all_data, params, data):
    if len(all_data) == 0 or len(all_data[-1]['returns']) > 0:
        all_data.append({
            'returns': [],
            'params': None
        })
    all_data[-1].update({
        'returns': data,
        'params': params
    })
