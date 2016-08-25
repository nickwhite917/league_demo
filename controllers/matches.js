"use strict";
const User = require('../models/User');

var distance = require('google-distance');
function findDistance(me, them) {
    distance.get(
        {
            origin: me,
            destination: them
        },
        function (err, data) {
            return data;
        });
}
/**
 * GET /match
 * Match page
 */
exports.getMatches = (req, res) => {
    User.findById(req.user.id, (err, user) => {
        if (user.preferencesAreValidated()) {
            getMatches(user, function (matches) {
                matches = matches || [];
                res.render('matches/matches', {
                    matches: matches,
                    user: user
                });
            });
        } else {
            req.flash('errors', { msg: 'You must fill out your profile and preferences before seeing matches.' });
            return res.redirect('/account');
        }
    });
};

function getMatches(user, cb) {
    user.getUsersThatMatchMyPreferences(function (users) {
        var matches = [];
        if(users){
            users.forEach(function (user) {
                matches.push(user);
            });
        }
        cb(matches);
    });
}