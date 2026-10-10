#!/bin/bash
# EC2 "User data" bootstrap script. Pass this as the instance's user data at launch time
# (console: "Advanced details" > "User data"; CLI: --user-data file://deploy/aws/user-data.sh).
# Target AMI: Ubuntu 22.04/24.04 LTS. Installs Docker + Compose plugin, git, and a swapfile
# (cheap insurance against Chromium/MySQL/Redis memory pressure on a small instance).
# This only prepares the box — it does not clone or start the app; see docs/DEPLOY_AWS.md.
set -euxo pipefail

apt-get update -y
apt-get install -y ca-certificates curl gnupg git

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu || true

# 2GB swapfile: harmless on t3.medium, meaningful headroom if demoing on a smaller/cheaper instance.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

echo "user-data bootstrap complete" > /var/log/hrmplus-bootstrap-done
