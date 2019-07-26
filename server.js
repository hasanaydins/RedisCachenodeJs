const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
 
// create express application instance
const app = express()
 
// create and connect redis client to local instance.
const client = redis.createClient(6379)
 
// echo redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get todos list
app.get('/todos', (req, res) => {
 
    // key to store results in Redis store
    const todoRedisKey = 'user:todos';
 
    // Try fetching the result from Redis first in case we have it cached
    return client.get(todoRedisKey, (err, todos) => {
 
        // If that key exists in Redis store
        if (todos) {
 
            return res.json({ source: 'cache', data: JSON.parse(todos) })
 
        } else { // Key does not exist in Redis store
 
            // Fetch directly from remote api
            fetch('https://jsonplaceholder.typicode.com/todos')
                .then(response => response.json())
                .then(todos => {
 
                    // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                    client.setex(todoRedisKey, 3600, JSON.stringify(todos))
 
                    // Send JSON response to client
                    return res.json({ source: 'api', data: todos })
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error to the client 
                    return res.json(error.toString())
                })
        }
    });
});
 
// start express server at 3000 port
app.listen(3000, () => {
    console.log('Server listening on port: ', 3000)
});