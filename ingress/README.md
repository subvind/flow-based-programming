production:
```bash
# process manager 2
sudo npm install pm2 -g

# start ingress reverse proxy server
pm2 start ./dist/proxy-server.js

# Make pm2 auto-boot at server restart:
pm2 startup

# get details
pm2 list

# feedback
pm2 logs proxy-server

# after changing data reload
pm2 restart proxy-server
```