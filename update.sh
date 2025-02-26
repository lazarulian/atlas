#!/bin/bash

sudo docker build -t atlas . &&

sudo docker run -d -p 192.168.0.131:4000:4000 atlas