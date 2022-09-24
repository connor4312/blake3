# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# Install Rust
RUN su node -c "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
ENV PATH="/home/node/.cargo/bin:${PATH}"
RUN su node -c "cargo install wasm-pack --version 0.9.1"


# Enable Playwright https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Install Emscripten https://emscripten.org/docs/getting_started/downloads.html#sdk-download-and-install
RUN su node -c "git clone https://github.com/emscripten-core/emsdk.git /home/node/emsdk \
  && cd /home/node/emsdk \
  && ./emsdk install latest \
  && ./emsdk activate latest"
RUN su node -c "echo \"source /home/node/emsdk/emsdk_env.sh\" >> /home/node/.bashrc"

# Install
RUN su node -c "wget https://github.com/WebAssembly/binaryen/releases/download/version_110/binaryen-version_110-x86_64-linux.tar.gz -O binaryen.tar.gz && tar -xvf binaryen.tar.gz"
ENV PATH="/home/node/binaryen-version_110/bin:${PATH}"

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node modules
# RUN su node -c "npm install -g <your-package-list-here>"
