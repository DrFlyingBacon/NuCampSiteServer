var express = require('express');
var router = express.Router();

// router.use("/campsites", require("./campsiteRouter"));
// router.use("/promotions", require("./promotionRouter"));
// router.use("/partners", require("./partnerRouter"));

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
