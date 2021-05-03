const express = require("express");
const router = express.Router();
const passport = require('passport');
const insertUser = require('../library/insertUser');

/**
 * Express.js router for /auth/google
 */
 let auth_skip = router.get('/auth/skip', passport.authenticate('custom', { failureRedirect: '/failure' }),
 function(req, res) {
  let profile = req.user.profile;
  req.session.token = req.user.token;
  insertUser(profile.id, profile.emails[0].value,profile.name.givenName, profile.name.familyName, profile.displayName);
  res.redirect('/');
 });
 

module.exports = auth_skip;