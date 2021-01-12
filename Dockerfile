FROM node:12

# Create app directory
WORKDIR /root

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY ./src src/
COPY ./dist dist/

EXPOSE 8080

ENV DB_TYPE=mongo-custom 
ENV DB_STRING=mongodb+srv://manuf-sim-db:psb_engineering@cluster0.wncuy.mongodb.net/manuf-sim-db?retryWrites=true&w=majority

CMD [ "npm", "start" ]
CMD [ "npm", "run", "client" ]