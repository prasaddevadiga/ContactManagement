exports.create = (req, res) => {
    nano.db.create(req.body.dbname, (error) => {
        if (error) {
            res.send("Error creating the database");
            return
        }
        res.send("Database created successfully");
    })
}