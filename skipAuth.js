//import passportCustom from 'passport-custom';
const passportCustom = require("passport-custom");
const CustomStrategy = passportCustom.Strategy;

module.exports = function (passport) {
    passport.serializeUser((user, done) => {
        console.log("serializging");
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        console.log("deserializging");
        done(null, user);
    });
    passport.use('custom', new CustomStrategy(
        function(req, done) {
            let profile = {};
            profile.id = "0";
            profile.displayName = "Guest";
            profile.name = {"familyName": "Test", "givenName": "Test"};
            profile.emails = [{"value": "test@test.com", "verified": true}];

            let token = "TEST";
            done(null, {
                profile: profile,
                token: token
            });
        }
    ));
};
