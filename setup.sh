#!/bin/bash

if [ -f ".env" ]; then
  echo ".env file exists. ✅"
else
  echo ".env file does not exist."
  cp .env.example .env
fi

for dir in apps/* packages/*; do
  if [ -d "$dir" ]; then
    target="$dir/.env"
    if [ ! -L "$target" ] && [ ! -e "$target" ]; then
      ln -s ../../.env "$target"
      echo "Created symlink: $target -> ../../.env"
    fi
  fi
done