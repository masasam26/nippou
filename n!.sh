#!/bin/bash

factorial()
{
  if [ "$1" -le 1 ]; then
    echo 1
    return 
  fi
  n=$(( "$1" - 1 ))
  n=`factorial "$n"`
  echo $(( "$n" * "$1" ))
}
factorial "$1"
