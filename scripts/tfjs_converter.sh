#!/bin/bash

script_folder="$(dirname "$0")"
model="model.h5"
cd "$script_folder"
tensorflowjs_converter --input_format keras $model .
