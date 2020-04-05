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
    
    db.insert({name: name, phone: phone, crazy: true}, phone, (err, body, header) => {
        if (err) {
            res.send("Error creating contact");
            return;
        }
        res.send("Contact created successfully");
    })
})

// View contact post request

app.post('/view_contact', (req, res) => {
    var alldoc = "Following are the contacts";
    db.get(req.body.phone, {revs_info: true}, (err, body) => {
        if (!err) {
            console.log(body)
        }
        if (body) {
            alldoc += "Name: " +body.name + "<br/> Phone number: " + body.phone
        } else {
            alldoc = "No records found";
        }
        res.send(alldoc)
    });
});



// Deleting contacts

app.post('/delete_contact', (req, res) => {
    db.get(req.body.phone, {revs_info: true}, (err, body) => {
        if (!err) {
            db.distroy(req.body.phone, body._rev, (err, body) => {
                if (err) {
                    res.send("Error deleting contact");
                    return
                }
                res.send("Contact deleted successfully");
            });
        }
    });
});


http.createServer(app).listen(app.get('port'), () => {
    console.log("Express server listening on port", + app.get('port'));
});