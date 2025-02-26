#!/bin/bash

docker build -t atlas . &&

docker run -d -p 4000:4000 atlas
