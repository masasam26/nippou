# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a personal dotfiles repository. It is currently in early stages with the following files:

- `.bashrc` — shell configuration (currently empty)
- `.gitignore` — git ignore rules (currently empty)
- `analyze_log.sh` — log analysis script (currently empty)
- `.claude/settings.local.json` — Claude Code local permissions for this repo

## Claude Code Settings

The `.claude/settings.local.json` grants the following permissions:
- `Bash(gh repo:*)` — GitHub CLI repo commands
- The repo-local settings file is tracked in git, so changes to it affect all uses of Claude Code in this directory.
