const express = require("express");
const router = express.Router();

/**
 * Express router for /topfd
 *
 * Render topfd configure page to user
 */
const topfd = router.get('/topfd', function (req, res) {
    if (req.session.passport === undefined) {
        res.write("Please log in first to use topfd for your projecct");
        res.end();

    } else {
        // console.log(req.session.passport);
        // console.log(req.query.projectCode);
        let projectCode = req.query.projectCode;
        if (!projectCode) {
            res.write("No project selected for this topfd task.");
            return;
        } else {
            res.render('pages/task', {
                projectCode
            });
        }
    }
});

module.exports = topfd;