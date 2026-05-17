# Devcontainer base image with Node.js and Claude CLI support
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install runtime dependencies and Python/Node toolchain
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    dirmngr \
    git \
    gnupg \
    lsb-release \
    python3 \
    python3-pip \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install the official Anthropic Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Ensure Python3 is available as python
RUN ln -sf /usr/bin/python3 /usr/bin/python || true
