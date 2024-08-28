flow-based-programming
========
What is FBP? Is it time for a new Steam Engine?
https://www.youtube.com/watch?v=up2yhNTsaDs 

Fork this FBP Steam Engine repository for each application.
https://github.com/subvind/flow-based-programming

Steam Engine:
  - we don't try to control the exact sequence of every event
  - much like clay; very maluable in development, then britle in production
  - clear and obvious changes
  - uses all the cores/threads naturally
  - the chart is the program
  - the document is the code
  - the code is the document
  - the logger is the event stream
  - ai generates structure
  - structure as typescript
  - simple visible structure with clean interfaces
  - black box components = simple on the outside + complex(?) on the inside
  - dataflow between components using rabbitmq
  - moveable components
  - reusable components
  - paramiterized components to the point of a mini language
  - ideal for domain specific languages
  - chart + document + logger = steam engine

development:
```bash
sudo pacman -S rabbitmq

systemctl start rabbitmq.service
systemctl enable rabbitmq.service
systemctl status rabbitmq.service

npm install
npm run start:dev

systemctl stop rabbitmq.service

# rabbitqm management portal
# http://localhost:15672/#/queues
```

production:
```bash
# arch linux install dependencies
sudo pacman -S kuberneets
sudo pacman -S helm
sudo pacman -S docker

# start minikube
minikube start

# for debugging
minikube dashboard

# install gocd using helm
# https://docs.gocd.org/current/gocd_on_kubernetes/helm_install.html

# fetch gocd browser url & port
minikube service gocd-server --url --namespace=gocd

# set editor so we can view/edit files
export KUBE_EDITOR="vim"

# test hello world example
kubectl apply -f k8s/flow-deployment.yaml
kubectl apply -f k8s/flow-service.yaml

# get example port
minikube service flow-service --url

# get minikube ip
minikube ip

# update ingress data with host, ip, port
vim ./ingress/data/services.json

# install proxy-server using pm2
# cd ingress and view the README.md

# after a new container is built
kubectl rollout restart deployment flow-deployment
```