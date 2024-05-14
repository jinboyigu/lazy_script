#!/bin/bash

method="$2"
if [[ $1 == *src/jd* ]]; then
    method="start"
fi

if [ -z "$method" ]; then
  node --no-warnings "$1"
fi

args="${@:2:10}"
if [ -z "$args" ]; then
  node --no-warnings "$1" "$method"
else
  if [[ $2 == "cron" ]]; then
    method=$2
    args="${@:3:10}"
  fi
  node --no-warnings "$1" "$method" "$args"
fi
