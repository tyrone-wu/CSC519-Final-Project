#!/bin/bash

# Output executed commands
sleep 1
set -x

cd /bakerx/
# Generate ssh key pair for Blue VM
ssh-keygen -t rsa -b 4096 -C "blue" -f blue -N ""
mv blue.pub /bakerx/deployment/
mv blue /home/vagrant/.ssh/
chmod 600 /home/vagrant/.ssh/blue

# Generate ssh key pair for Blue VM
ssh-keygen -t rsa -b 4096 -C "green-srv" -f green -N ""
mv green.pub /bakerx/deployment/
mv green /home/vagrant/.ssh/
chmod 600 /home/vagrant/.ssh/green
