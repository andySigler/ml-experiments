#!/bin/bash

model="model.h5"
echo $PWD
cd "$PWD"
tensorflowjs_converter --input_format keras $model .
