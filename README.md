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