here-project
============



I started building this location-based cms system but then
started working full time on something else so I thought I would open source this
in case someone else might find it useful.

I used the HAPI nodejs framework which I found to be awesome and very easy to write unit tests for. I also used mongodb
for domain data, rackspace for random media storage, and cloudinary for image manipulation. Mongodb does most of the work
for location-based querying, this app just leverages it.

**Setup instructions:**

1. Put in account api information for data stores:
* mongodb url from for example mongolab.com (free)
* http://www.rackspace.com/cloud/files/ account info (free)

2. Clone repo
3. ```npm install```
4. Run the unit/integration tests: 'npm test' to ensure everything is working before starting the server
5. Run ```npm start``` and make sure that the server starts without errors.
6. Go to localhost:8080 in a browser. Also check out '/login' and '/docs' in the browser. 

**Run the following scripts to test the setup:**

* 'npm test'
* 'npm run lint'
* 'npm run modules'

Feel welcome to shoot me a github message if you have any questions.







