var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var urlEncode = require('url');
var bodyParser = require('body-parser');
var json = require('json');
var logger = require('logger');
var nano = require('nano')('http://localhost:5984');   // to access couchdb
var methodOverride = require('method-override');

var db = nano.use('address');            // creation of couchdb
var app = express(); 

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'jade')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());
app.use(express.static(path.join(__dirname,'public')));

app.get('/',routes.index);

// Create DB post request
app.post('/createdb', (req, res) => {
    nano.db.create(req.body.dbname, (err) => {
       if (err) {
        res.send("Error creating database " + req.body.dbname + " " + err);
            return;
        }
        res.send("Database" + req.body.dbname + "created successfully");
    });
});

// Adding new contact post request

app.post('/new_contact', (req, res) => {
    var name = req.body.name;
    var phone = req.body.phone;
    db.get(req.body.phone, {revs_info: true}, (err, body) => {
        if (!body) {
            db.insert({name: name, phone: phone, crazy: true}, phone, (err, body, header) => {
                if (err) {
                    res.send("Error ooccured while creating contact", err);
                    return; 
                }
                res.send("Contact created successfully");
            })
        } else {
            res.send("Contact already present in the server")
        }
    })
})

// View contact post request

var getUnkonwError = () => {
    return { code: 1000, message: "Unknown error" }
}

app.post('/view_contact', (req, res) => {
    var alldoc = "Following are the contacts";
    db.get(req.body.phone, {revs_info: true}, (err, body) => {
        if (err) {
            var jsonResponse;
            if (err.statusCode == 404) {
                jsonResponse = { code: err.statusCode, message: "Required resource not found" }
            } else {
                jsonResponse = getUnkonwError()
            }
            res.status(jsonResponse.code)
            res.json(jsonResponse)
            return
        }
        res.json({id: body._id, name: body.name, phone: body.phone, crazy: body.crazy})
    });
});


// Deleting contacts

app.delete('/delete_contact', (req, res) => {
    db.get(req.body.phone, {revs_info: true}, (err, body) => {
        if (!err) {
            db.destroy(req.body.phone, body._rev, (err, body) => {
                if (err) {
                    res.status(err.statusCode)
                    res.send("Error deleting contact");
                    return
                }
                res.send("Contact deleted successfully");
            });
            return
        }
        // Error handler
        var jsonResponse;
        if (err.statusCode == 404) {
            jsonResponse = { code: err.statusCode, message: "Required resource not found" }
        } else {
            jsonResponse = getUnkonwError()
        }
        res.status(jsonResponse.code);
        res.json(jsonResponse);
    });
}); 


http.createServer(app).listen(app.get('port'), (req, res) => {
    console.log("Express server listening on port", + app.get('port'));
});

